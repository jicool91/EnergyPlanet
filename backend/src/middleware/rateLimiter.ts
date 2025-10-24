/**
 * Rate Limiter Middleware
 */

import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AuthRequest } from './auth';

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
