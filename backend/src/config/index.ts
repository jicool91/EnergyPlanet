/**
 * Application Configuration
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envResult = dotenv.config();

// If docker-compose (или другая обвязка) передала пустые строки,
// подставляем значения из .env, чтобы не терять токены и секреты.
if (!envResult.error && envResult.parsed) {
  for (const [key, value] of Object.entries(envResult.parsed)) {
    const current = process.env[key];
    if (current === undefined || current === '') {
      process.env[key] = value;
    }
  }
}

function parseDatabaseFromUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    const sslParam = url.searchParams.get('sslmode');

    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 5432,
      name: url.pathname ? url.pathname.replace(/^\//, '') : undefined,
      user: url.username || undefined,
      password: url.password || undefined,
      ssl: sslParam ? sslParam.toLowerCase() !== 'disable' : url.protocol === 'postgresql:',
    };
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL', error);
    return null;
  }
}

function parseRedisFromUrl(urlString: string) {
  try {
    const url = new URL(urlString);
    const dbSegment = url.pathname.replace(/^\//, '');

    return {
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 6379,
      password: url.password || undefined,
      db: dbSegment ? parseInt(dbSegment, 10) : undefined,
      tls: url.protocol === 'rediss:',
      url: urlString,
    };
  } catch (error) {
    console.warn('Failed to parse REDIS_URL', error);
    return null;
  }
}

const rawRuntimeEnv =
  process.env.APP_ENV ||
  process.env.NODE_ENV ||
  (process.env.RAILWAY_ENVIRONMENT_NAME ? 'production' : undefined) ||
  'development';

const normalizedRuntimeEnv = (() => {
  const value = rawRuntimeEnv.toLowerCase();
  if (value === 'prod') {
    return 'production';
  }
  if (value === 'dev') {
    return 'development';
  }
  return value;
})();

const databaseDefaults = {
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
  name: process.env.DB_NAME || process.env.PGDATABASE || 'energy_planet',
  user: process.env.DB_USER || process.env.PGUSER || 'energyplanet_app',
  password: process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? '',
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
  ssl: process.env.DB_SSL === 'true',
};

const databaseFromUrl = parseDatabaseFromUrl(
  process.env.DATABASE_URL || process.env.POSTGRES_URL || ''
);

const redisDefaults = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  tls: process.env.REDIS_TLS === 'true',
  url: undefined as string | undefined,
};

const redisFromUrl = parseRedisFromUrl(process.env.REDIS_URL || '');

export const config = {
  server: {
    env: normalizedRuntimeEnv,
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '::',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },

  database: {
    host: databaseFromUrl?.host ?? databaseDefaults.host,
    port: databaseFromUrl?.port ?? databaseDefaults.port,
    name: databaseFromUrl?.name ?? databaseDefaults.name,
    user: databaseFromUrl?.user ?? databaseDefaults.user,
    password: databaseFromUrl?.password ?? databaseDefaults.password,
    poolMin: databaseDefaults.poolMin,
    poolMax: databaseDefaults.poolMax,
    ssl:
      process.env.DB_SSL !== undefined
        ? process.env.DB_SSL === 'true'
        : databaseFromUrl?.ssl ?? databaseDefaults.ssl,
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined,
  },

  redis: {
    host: redisFromUrl?.host ?? redisDefaults.host,
    port: redisFromUrl?.port ?? redisDefaults.port,
    password: redisFromUrl?.password ?? redisDefaults.password,
    db: redisFromUrl?.db ?? redisDefaults.db,
    tls:
      process.env.REDIS_TLS !== undefined
        ? process.env.REDIS_TLS === 'true'
        : redisFromUrl?.tls ?? redisDefaults.tls,
    url: redisFromUrl?.url ?? undefined,
  },

  cache: {
    enabled: process.env.CACHE_ENABLED !== 'false',
    ttl: {
      leaderboard: parseInt(process.env.CACHE_TTL_LEADERBOARD || '30', 10),
      profile: parseInt(process.env.CACHE_TTL_PROFILE || '15', 10),
    },
  },

  telegram: {
    get botTokens() {
      const tokenEnvKeys = Object.keys(process.env).filter(key =>
        key === 'TELEGRAM_BOT_TOKEN' || key.startsWith('TELEGRAM_BOT_TOKEN_')
      );

      const tokens = tokenEnvKeys.flatMap((key) => {
        const value = process.env[key] || '';
        return value
          .split(/[,;\s]+/)
          .map(token => token.trim())
          .filter(Boolean);
      });

      return Array.from(new Set(tokens));
    },
    get botToken() {
      const tokens = this.botTokens;
      return tokens.length > 0 ? tokens[0] : '';
    },
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
    miniAppUrl: process.env.TELEGRAM_MINI_APP_URL || '',
    authDataMaxAgeSec: parseInt(process.env.TELEGRAM_AUTHDATA_MAX_AGE_SEC || '86400', 10),
    get allowedOrigins() {
      const defaults = ['https://t.me'];
      const raw = process.env.TELEGRAM_ALLOWED_ORIGINS;
      if (!raw || raw.trim().length === 0) {
        return defaults;
      }

      const parsed = raw
        .split(/[,\s]+/)
        .map(origin => origin.trim())
        .filter(Boolean);

      const merged = new Set([...defaults, ...parsed]);
      return Array.from(merged);
    },
    paymentWebhookSecret: process.env.TELEGRAM_PAYMENT_WEBHOOK_SECRET || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  monetization: {
    starsEnabled: process.env.TELEGRAM_STARS_ENABLED === 'true',
    adProvider: process.env.AD_PROVIDER || 'yandex',
    yandexAdBlockId: process.env.YANDEX_AD_BLOCK_ID || '',
    yandexAdTokenSecret: process.env.YANDEX_AD_TOKEN_SECRET || '',
  },

  content: {
    // Content is now part of backend/ package
    // Location: backend/content/ (development and production)
    path: path.join(__dirname, '../content'),
    reloadIntervalMin: parseInt(process.env.CONTENT_RELOAD_INTERVAL_MIN || '60', 10),
  },

  antiCheat: {
    enabled: process.env.ANTI_CHEAT_ENABLED !== 'false',
    autoBan: process.env.ANTI_CHEAT_AUTO_BAN === 'true',
    alertAdmins: process.env.ANTI_CHEAT_ALERT_ADMINS !== 'false',
  },

  rateLimit: {
    enabled:
      normalizedRuntimeEnv === 'test'
        ? false
        : process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    auth: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '60000', 10),
      maxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '8', 10),
    },
  },

  security: {
    refreshAuditRetentionDays: parseInt(process.env.SESSION_REFRESH_AUDIT_TTL_DAYS || '30', 10),
  },

  logging: {
    level:
      process.env.LOG_LEVEL ||
      (normalizedRuntimeEnv === 'production' ? 'warn' : 'debug'),
    format: process.env.LOG_FORMAT || 'json',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    errorFilePath: process.env.LOG_ERROR_FILE_PATH || './logs/error.log',
    enableFileTransports: process.env.LOG_ENABLE_FILE_TRANSPORTS === 'true',
    requestSampleRate: (() => {
      const raw = parseFloat(process.env.LOG_REQUEST_SAMPLE_RATE || '0.005');
      if (!Number.isFinite(raw)) {
        return 0;
      }
      return Math.min(Math.max(raw, 0), 1);
    })(),
    telemetrySampleRate: (() => {
      const raw = parseFloat(process.env.LOG_TELEMETRY_SAMPLE_RATE || '0.01');
      if (!Number.isFinite(raw)) {
        return 0;
      }
      return Math.min(Math.max(raw, 0), 1);
    })(),
    tickSampleRate: (() => {
      const raw = parseFloat(process.env.LOG_TICK_SAMPLE_RATE || '0');
      if (!Number.isFinite(raw)) {
        return 0;
      }
      return Math.min(Math.max(raw, 0), 1);
    })(),
    clientErrorSampleRate: (() => {
      const raw = parseFloat(process.env.LOG_CLIENT_ERROR_SAMPLE_RATE || '0.1');
      if (!Number.isFinite(raw)) {
        return 0;
      }
      return Math.min(Math.max(raw, 0), 1);
    })(),
    slowRequestThresholdMs: parseInt(process.env.LOG_SLOW_REQUEST_THRESHOLD_MS || '500', 10),
    slowQueryThresholdMs: parseInt(process.env.LOG_SLOW_QUERY_THRESHOLD_MS || '500', 10),
  },

  session: {
    timeoutMin: parseInt(process.env.SESSION_TIMEOUT_MIN || '30', 10),
    maxOfflineHours: parseInt(process.env.MAX_OFFLINE_HOURS || '12', 10),
    offlineIncomeMultiplier: parseFloat(process.env.OFFLINE_INCOME_MULTIPLIER || '0.5'),
  },

  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['*'],
    credentials: process.env.CORS_CREDENTIALS !== 'false',
  },

  admin: {
    telegramIds: process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => parseInt(id, 10)) || [],
    superAdminId: process.env.SUPER_ADMIN_TELEGRAM_ID ? parseInt(process.env.SUPER_ADMIN_TELEGRAM_ID, 10) : null,
  },

  prometheus: {
    enabled: process.env.PROMETHEUS_ENABLED !== 'false',
    port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    metricsPath: process.env.PROMETHEUS_METRICS_PATH || '/metrics',
    basicAuthUser: process.env.PROM_AUTH_USER || '',
    basicAuthPass: process.env.PROM_AUTH_PASS || '',
  },

  cdn: {
    url: process.env.CDN_URL || 'https://cdn.energyplanet.game',
  },

  testing: {
    testMode: process.env.TEST_MODE === 'true',
    bypassAuth: process.env.BYPASS_TELEGRAM_AUTH === 'true',
    mockPayments: process.env.MOCK_PAYMENTS === 'true',
  },
};

export default config;
