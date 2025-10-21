import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiRouter from './api/routes';
import config from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { connectDatabase, healthCheck as databaseHealth } from './db/connection';
import { connectRedis, healthCheck as redisHealth } from './cache/redis';
import { loadContent } from './services/ContentService';

const app: Application = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  logger.info('📨 Incoming request', {
    method: req.method,
    path: req.path,
    origin: req.get('origin'),
    host: req.get('host'),
  });
  next();
});

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

app.use(config.server.apiPrefix, apiRouter);

app.use(errorHandler);

export async function bootstrap() {
  await connectDatabase();
  await connectRedis();
  await loadContent();

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
