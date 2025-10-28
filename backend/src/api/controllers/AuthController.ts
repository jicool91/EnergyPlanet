/**
 * Authentication Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/AuthService';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

interface TelegramInitBody {
  initData?: unknown;
}

interface RefreshBody {
  refresh_token?: unknown;
}

type TelegramHeaderRequest = Request<Record<string, never>, unknown, TelegramInitBody>;
type RefreshRequest = Request<Record<string, never>, unknown, RefreshBody>;
type HttpRequest = Request<Record<string, never>, unknown, Record<string, unknown>>;

const getSingleHeader = (value: string | string[] | undefined): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.find(entry => typeof entry === 'string') ?? null;
  }
  return null;
};

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  authenticateWithTelegram = async (req: TelegramHeaderRequest, res: Response, next: NextFunction) => {
    try {
      const initDataRaw = req.body?.initData;

      if (typeof initDataRaw !== 'string' || initDataRaw.trim().length === 0) {
        logger.warn('Telegram authentication failed', {
          reason: 'init_data_missing',
          initDataLength: 0,
          telegramUserId: null,
          botToken: null,
        });
        throw new AppError(400, 'initData is required');
      }

      const initData = initDataRaw.trim();
      const result = await this.authService.authenticateWithTelegram(initData);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  authenticateWithTelegramHeader = async (req: HttpRequest, res: Response, next: NextFunction) => {
    try {
      const authorization = getSingleHeader(req.headers.authorization);

      if (!authorization) {
        logger.warn('Telegram header authentication failed', {
          reason: 'authorization_missing',
          origin: req.headers.origin,
          ip: req.ip,
        });
        throw new AppError(400, 'authorization_header_missing');
      }

      const trimmedAuthorization = authorization.trim();
      const firstSpace = trimmedAuthorization.indexOf(' ');
      const scheme = firstSpace === -1 ? trimmedAuthorization : trimmedAuthorization.slice(0, firstSpace);
      const payload = firstSpace === -1 ? '' : trimmedAuthorization.slice(firstSpace + 1).trim();
      const normalizedScheme = scheme.toLowerCase();
      const allowedSchemes = new Set(['tma', 'telegraminit']);

      if (!scheme || !payload) {
        logger.warn('Telegram header authentication failed', {
          reason: 'authorization_malformed',
          origin: req.headers.origin,
          ip: req.ip,
        });
        throw new AppError(400, 'authorization_header_malformed');
      }

      if (!allowedSchemes.has(normalizedScheme)) {
        logger.warn('Telegram header authentication failed', {
          reason: 'authorization_scheme_invalid',
          scheme,
          origin: req.headers.origin,
          ip: req.ip,
        });
        throw new AppError(400, 'authorization_scheme_invalid');
      }

      const result = await this.authService.authenticateWithTelegram(payload, {
        enforceReplayProtection: true,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: RefreshRequest, res: Response, next: NextFunction) => {
    try {
      const refreshTokenRaw = req.body?.refresh_token;

      if (typeof refreshTokenRaw !== 'string' || refreshTokenRaw.trim().length === 0) {
        throw new AppError(400, 'refresh_token is required');
      }

      const result = await this.authService.refreshAccessToken(refreshTokenRaw.trim());

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
