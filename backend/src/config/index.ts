/**
 * Application Configuration
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  server: {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'energy_planet',
    user: process.env.DB_USER || 'energyplanet_app',
    password: process.env.DB_PASSWORD || '',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
    ssl: process.env.DB_SSL === 'true',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS === 'true',
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
    miniAppUrl: process.env.TELEGRAM_MINI_APP_URL || '',
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
    path: process.env.CONTENT_PATH || path.join(__dirname, '../../../content'),
    reloadIntervalMin: parseInt(process.env.CONTENT_RELOAD_INTERVAL_MIN || '60', 10),
  },

  antiCheat: {
    enabled: process.env.ANTI_CHEAT_ENABLED !== 'false',
    autoBan: process.env.ANTI_CHEAT_AUTO_BAN === 'true',
    alertAdmins: process.env.ANTI_CHEAT_ALERT_ADMINS !== 'false',
  },

  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    errorFilePath: process.env.LOG_ERROR_FILE_PATH || './logs/error.log',
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
