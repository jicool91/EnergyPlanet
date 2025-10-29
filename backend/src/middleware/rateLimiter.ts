/**
 * Rate Limiter Middleware
 */

import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AuthRequest } from './auth';
import { recordAuthRequestMetric } from '../metrics/auth';
import { logger } from '../utils/logger';

const userKey = (req: Request): string => {
  const authReq = req as AuthRequest;
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }
  if (authReq.user?.telegramId) {
    return `tg:${authReq.user.telegramId}`;
  }
  return `ip:${req.ip ?? 'anonymous'}`;
};

const shouldSkip = () => !config.rateLimit.enabled || process.env.NODE_ENV === 'test';

const resolveAuthEndpoint = (path: string): 'tma' | 'refresh' | 'telegram' | 'other' => {
  if (path.endsWith('/auth/tma')) {
    return 'tma';
  }
  if (path.endsWith('/auth/refresh')) {
    return 'refresh';
  }
  if (path.endsWith('/auth/telegram')) {
    return 'telegram';
  }
  return 'other';
};

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  skip: shouldSkip,
});

export const tapRateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // 10 req/sec
  message: {
    error: 'tap_rate_limit_exceeded',
    message: 'Too many taps, slow down!',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  skip: shouldSkip,
});

export const upgradeRateLimiter = rateLimit({
  windowMs: 1000,
  max: 5,
  message: {
    error: 'upgrade_rate_limit_exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  skip: shouldSkip,
});

export const tickRateLimiter = rateLimit({
  windowMs: 8000,
  max: 1,
  message: {
    error: 'tick_rate_limit_exceeded',
    message: 'Ticking too fast, slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  skip: shouldSkip,
});

export const purchaseRateLimiter = rateLimit({
  windowMs: 10000, // 10 seconds
  max: 1,
  message: {
    error: 'purchase_rate_limit_exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: userKey,
  skip: shouldSkip,
});

/**
 * Auth endpoints rate limiter
 * Prevents brute force attacks on authentication endpoints
 * 5 auth attempts per minute per IP/user
 * This protects /auth/tma and /auth/refresh endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: Math.max(config.rateLimit.auth.maxRequests, 1),
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
    const endpoint = resolveAuthEndpoint(req.path);
    const statusCode = options.statusCode ?? 429;

    res.setHeader('Retry-After', retryAfterSeconds);

    logger.warn(
      {
        path: req.path,
        ip: req.ip,
        retryAfterSeconds,
      },
      'auth_rate_limit_triggered'
    );

    recordAuthRequestMetric(endpoint, statusCode, 'rate_limited');

    res.status(statusCode).json({
      error: 'auth_rate_limit_exceeded',
      message: 'Too many authentication attempts, please try again in a few minutes',
      retry_after: retryAfterSeconds,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // For auth endpoints, prioritize IP-based limiting (unauthenticated requests)
    // to prevent brute force attacks from same IP
    return `ip:${req.ip ?? 'anonymous'}`;
  },
  skip: (req: Request) => {
    return !config.rateLimit.enabled || process.env.NODE_ENV === 'test' || req.path === '/health';
  },
});
