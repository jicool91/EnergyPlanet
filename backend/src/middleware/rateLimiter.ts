/**
 * Rate Limiter Middleware
 */

import { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { AuthRequest } from './auth';

const userKey = (req: Request) => {
  const authReq = req as AuthRequest;
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }
  if (authReq.user?.telegramId) {
    return `tg:${authReq.user.telegramId}`;
  }
  return req.ip;
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
});
