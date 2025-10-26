import express, { Application } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase, healthCheck as databaseHealth } from './db/connection';
import { migrateUp, closeMigrationPool } from './db/migrate';
import { connectRedis, healthCheck as redisHealth } from './cache/redis';
import { loadContent } from './services/ContentService';
import { tapAggregator } from './services/TapAggregator';
import apiRouter from './api/routes';
import { rateLimiter } from './middleware/rateLimiter';
import { register as metricsRegister, metricsEnabled } from './metrics';

const app: Application = express();

async function ensureMigrations() {
  try {
    logger.info('Running database migrations');
    await migrateUp();
  } catch (error) {
    logger.error('Failed to apply database migrations', { error });
    throw error;
  } finally {
    await closeMigrationPool().catch(poolError => {
      logger.warn('Failed to close migration pool', { error: poolError });
    });
  }
}

app.use(helmet());
app.use(compression());
const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin;

    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: config.cors.credentials,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const isTickRequest = (req: express.Request) =>
  req.method === 'POST' && req.path === `${config.server.apiPrefix}/tick`;

const shouldSampleTickLog = () => {
  if (!config.logging.tickSampleRate) {
    return false;
  }
  return Math.random() < config.logging.tickSampleRate;
};

app.use((req, _res, next) => {
  if (isTickRequest(req)) {
    if (shouldSampleTickLog()) {
      logger.debug('tick_request_sampled', {
        origin: req.get('origin'),
        host: req.get('host'),
        userAgent: req.get('user-agent'),
      });
    }
  } else {
    logger.info('📨 Incoming request', {
      method: req.method,
      path: req.path,
      origin: req.get('origin'),
      host: req.get('host'),
    });
  }
  next();
});

if (config.rateLimit.enabled) {
  app.use(config.server.apiPrefix, rateLimiter);
}

app.get('/health', async (_req, res) => {
  const [dbHealthy, redisHealthy] = await Promise.all([
    databaseHealth().catch(() => false),
    redisHealth().catch(() => false),
  ]);

  const status = dbHealthy && redisHealthy ? 'ok' : 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    services: {
      database: dbHealthy,
      redis: redisHealthy,
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

if (metricsEnabled) {
  app.get(config.prometheus.metricsPath, async (req, res) => {
    if (config.prometheus.basicAuthUser && config.prometheus.basicAuthPass) {
      const authHeader = req.headers.authorization || '';
      const expected = `Basic ${Buffer.from(`${config.prometheus.basicAuthUser}:${config.prometheus.basicAuthPass}`).toString('base64')}`;
      if (authHeader !== expected) {
        res.setHeader('WWW-Authenticate', 'Basic realm="metrics"');
        res.status(401).send('Unauthorized');
        return;
      }
    }

    const metrics = await metricsRegister.metrics();
    res.set('Content-Type', metricsRegister.contentType);
    res.send(metrics);
    return;
  });
}

app.use(config.server.apiPrefix, apiRouter);

app.use(errorHandler);

export async function bootstrap() {
  await ensureMigrations();
  await connectDatabase();
  await connectRedis();
  await loadContent();
  tapAggregator.start();

  const port = config.server.port;

  const server = app.listen(port, config.server.host, () => {
    logger.info('Energy Planet API started', {
      port,
      host: config.server.host,
      apiPrefix: config.server.apiPrefix,
    });
  });

  const shutdown = (signal: string) => {
    logger.warn(`${signal} received, shutting down gracefully`);
    tapAggregator.stop();
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return server;
}

if (require.main === module) {
  bootstrap().catch(error => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });
}

export default app;
