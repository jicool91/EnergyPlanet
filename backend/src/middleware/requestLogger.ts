/**
 * Request Logger Middleware
 */

import { Response, NextFunction } from 'express';
import { logger, getRequestId } from '../utils/logger';
import config from '../config';
import { AuthRequest } from './auth';

const SKIP_PATHS = new Set(['/health', config.prometheus.metricsPath]);
const SKIP_PREFIXES = ['/static', '/assets', '/favicon', '/robots.txt'];

const shouldSkip = (path: string) =>
  SKIP_PATHS.has(path) || SKIP_PREFIXES.some(prefix => path.startsWith(prefix));

const shouldSampleSuccess = () => {
  if (config.server.env !== 'production') {
    return true;
  }
  const rate = config.logging.requestSampleRate;
  return rate > 0 && Math.random() < rate;
};

const shouldSampleClientError = () => {
  if (config.server.env !== 'production') {
    return true;
  }
  const rate = config.logging.clientErrorSampleRate;
  return rate > 0 && Math.random() < rate;
};

export const requestLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const start = Date.now();

  if (shouldSkip(req.path)) {
    next();
    return;
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const isSlow = duration >= config.logging.slowRequestThresholdMs;
    const meta = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
      requestId: getRequestId(),
      slow: isSlow || undefined,
    };

    if (res.statusCode >= 500) {
      logger.error(meta, 'http_request_failed');
      return;
    }

    if (res.statusCode >= 400) {
      if (shouldSampleClientError()) {
        logger.warn(meta, 'http_request_client_error');
      }
      return;
    }

    if (isSlow) {
      logger.warn(
        { ...meta, thresholdMs: config.logging.slowRequestThresholdMs },
        'http_request_slow'
      );
      return;
    }

    if (shouldSampleSuccess()) {
      logger.info(meta, 'http_request_success');
    }
  });

  next();
};
