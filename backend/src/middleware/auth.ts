/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    telegramId: number;
    username?: string;
    isAdmin: boolean;
  };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('auth_missing_header', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
      });
      throw new AppError(401, 'unauthorized');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    req.user = {
      id: decoded.userId,
      telegramId: decoded.telegramId,
      username: decoded.username,
      isAdmin: decoded.isAdmin || false,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('auth_token_expired', { path: req.path, origin: req.headers.origin, ip: req.ip });
      next(new AppError(401, 'token_expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('auth_invalid_token', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
        message: error.message,
      });
      next(new AppError(401, 'invalid_token'));
    } else {
      logger.error('auth_unexpected_error', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
        error,
      });
      next(error);
    }
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    throw new AppError(403, 'forbidden');
  }
  next();
};
