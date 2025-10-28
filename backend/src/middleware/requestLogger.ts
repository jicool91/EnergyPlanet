/**
 * Request Logger Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import config from '../config';

const shouldSample = () => {
  if (config.server.env !== 'production') {
    return true;
  }

  const rate = config.logging.requestSampleRate;
  if (!rate) {
    return false;
  }
  return Math.random() < rate;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.get('user-agent'),
      userId: (req as any).user?.id,
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request', meta);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', meta);
      return;
    }

    if (shouldSample()) {
      logger.info('HTTP Request', meta);
    }
  });

  next();
};
