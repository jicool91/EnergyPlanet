/**
 * Global Error Handler Middleware
 */

import { Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AuthRequest } from './auth';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: AuthRequest,
  res: Response,
  _next: NextFunction
) => {
  const isRequestAborted =
    (err as { type?: string }).type === 'entity.request.aborted' ||
    err.message === 'request aborted';

  if (isRequestAborted) {
    logger.debug(
      {
        path: req.path,
        method: req.method,
        message: 'request_aborted',
      },
      'request_aborted'
    );
    return res.status(408).json({
      error: 'request_aborted',
      message: 'Client aborted the request before completion',
    });
  }

  if (err instanceof AppError) {
    logger.warn(
      {
        statusCode: err.statusCode,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        message: err.message,
        details: err.details,
      },
      'app_error'
    );

    const payload: Record<string, unknown> = {
      error: err.message,
    };

    if (err.details && Object.keys(err.details).length > 0) {
      payload.details = err.details;
    }

    if (process.env.NODE_ENV === 'development' && err.stack) {
      payload.stack = err.stack;
    }

    return res.status(err.statusCode).json(payload);
  }

  // Unknown error
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    'unexpected_error'
  );

  return res.status(500).json({
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
  });
};
