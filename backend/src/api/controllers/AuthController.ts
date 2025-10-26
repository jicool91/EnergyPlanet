/**
 * Authentication Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/AuthService';
import { AppError } from '../../middleware/errorHandler';
import { logger } from '../../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  authenticateWithTelegram = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { initData } = req.body;

      if (!initData) {
        logger.warn('Telegram authentication failed', {
          reason: 'init_data_missing',
          initDataLength: 0,
          telegramUserId: null,
          botToken: null,
        });
        throw new AppError(400, 'initData is required');
      }

      const result = await this.authService.authenticateWithTelegram(initData);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  authenticateWithTelegramHeader = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const authorization = Array.isArray(header) ? header[0] : header;

      if (!authorization) {
        logger.warn('Telegram header authentication failed', {
          reason: 'authorization_missing',
          origin: req.headers.origin,
          ip: req.ip,
        });
        throw new AppError(400, 'authorization_header_missing');
      }

      const [scheme, ...rest] = authorization.trim().split(/\s+/);
      const initData = rest.join(' ').trim();
      const normalizedScheme = (scheme || '').toLowerCase();
      const allowedSchemes = new Set(['tma', 'telegraminit']);

      if (!scheme || !initData) {
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

      const result = await this.authService.authenticateWithTelegram(initData, {
        enforceReplayProtection: true,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw new AppError(400, 'refresh_token is required');
      }

      const result = await this.authService.refreshAccessToken(refresh_token);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
