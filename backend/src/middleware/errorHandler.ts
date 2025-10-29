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
    public isOperational = true
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
      },
      'app_error'
    );

    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
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
