/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { AuthService } from '../services/AuthService';
import { recordTickUnauthorized, recordTickError } from '../metrics/tick';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    telegramId: number;
    username?: string;
    isAdmin: boolean;
  };
  authContext?: {
    strategy: 'bearer' | 'tma';
    issuedTokens?: {
      accessToken: string;
      refreshToken: string;
      refreshExpiresAt: string;
      expiresIn: number;
    };
  };
}

const authService = new AuthService();

const normalizeAuthorizationHeader = (header?: string | string[] | undefined): string | null => {
  if (!header) {
    return null;
  }
  return Array.isArray(header) ? header[0] : header;
};

interface AccessTokenPayload extends JwtPayload {
  userId: string;
  telegramId: number;
  username?: string;
  isAdmin?: boolean;
}

const isAccessTokenPayload = (decoded: JwtPayload | string): decoded is AccessTokenPayload => {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'userId' in decoded &&
    'telegramId' in decoded
  );
};

const setUserFromDecodedToken = (req: AuthRequest, decoded: AccessTokenPayload) => {
  req.user = {
    id: decoded.userId,
    telegramId: decoded.telegramId,
    username: decoded.username,
    isAdmin: decoded.isAdmin || false,
  };
  req.authContext = { strategy: 'bearer' };
};

const tryAuthenticateWithBearer = (req: AuthRequest, header: string | null): boolean => {
  if (!header || !header.trim().toLowerCase().startsWith('bearer ')) {
    return false;
  }

  const token = header.trim().substring(7);
  if (!token) {
    logger.warn('auth_missing_header', {
      path: req.path,
      origin: req.headers.origin,
      ip: req.ip,
    });
    throw new AppError(401, 'unauthorized');
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (!isAccessTokenPayload(decoded)) {
      logger.warn('auth_invalid_payload', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
      });
      throw new AppError(401, 'invalid_token');
    }
    setUserFromDecodedToken(req, decoded);
    return true;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('auth_token_expired', { path: req.path, origin: req.headers.origin, ip: req.ip });
      throw new AppError(401, 'token_expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('auth_invalid_token', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
        message: error.message,
      });
      throw new AppError(401, 'invalid_token');
    } else {
      logger.error('auth_unexpected_error', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
};

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const header = normalizeAuthorizationHeader(req.headers.authorization);

    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      logger.warn('auth_missing_header', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
      });
      throw new AppError(401, 'unauthorized');
    }

    const handled = tryAuthenticateWithBearer(req, header);
    if (!handled) {
      throw new AppError(401, 'unauthorized');
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    throw new AppError(403, 'forbidden');
  }
  next();
};

export const authenticateTick = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const header = normalizeAuthorizationHeader(req.headers.authorization);

    if (tryAuthenticateWithBearer(req, header)) {
      return next();
    }

    if (!header) {
      logger.warn('auth_missing_header', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
      });
      recordTickUnauthorized('missing_header');
      throw new AppError(401, 'authorization_header_missing');
    }

    const [scheme, ...rest] = header.trim().split(/\s+/);
    const payload = rest.join(' ').trim();
    const normalizedScheme = (scheme || '').toLowerCase();
    const allowedSchemes = new Set(['tma', 'telegraminit']);

    if (!allowedSchemes.has(normalizedScheme)) {
      logger.warn('auth_invalid_scheme', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
        scheme,
      });
      recordTickUnauthorized('invalid_scheme');
      throw new AppError(400, 'authorization_scheme_invalid');
    }

    if (!payload) {
      logger.warn('auth_invalid_header', {
        path: req.path,
        origin: req.headers.origin,
        ip: req.ip,
        scheme,
      });
      recordTickUnauthorized('malformed');
      throw new AppError(400, 'authorization_header_malformed');
    }

    const authResult = await authService.authenticateWithTelegram(payload, {
      enforceReplayProtection: true,
    });

    req.user = {
      id: authResult.user_id,
      telegramId: authResult.telegram_id,
      username: authResult.username ?? undefined,
      isAdmin: Boolean(authResult.is_admin),
    };

    req.authContext = {
      strategy: 'tma',
      issuedTokens: {
        accessToken: authResult.access_token,
        refreshToken: authResult.refresh_token,
        refreshExpiresAt: authResult.refresh_expires_at,
        expiresIn: authResult.expires_in,
      },
    };

    next();
  } catch (error) {
    const reason =
      error instanceof AppError ? error.message : error instanceof Error ? error.name : 'unexpected_error';

    if (reason === 'unauthorized') {
      recordTickUnauthorized('bearer_missing');
    } else if (reason === 'token_expired' || reason === 'invalid_token') {
      recordTickError(reason);
    } else {
      recordTickError(reason);
    }

    next(error);
  }
};
