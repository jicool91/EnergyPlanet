/**
 * Authentication Service
 * Handles Telegram OAuth and JWT token generation
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export class AuthService {
  /**
   * Verify Telegram initData hash
   */
  private verifyTelegramHash(initData: string): TelegramUser {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const dataCheckString = Array.from(urlParams.entries())
      .filter(([key]) => key !== 'hash')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.telegram.botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      throw new AppError(401, 'invalid_telegram_hash');
    }

    // Parse user data
    const userParam = urlParams.get('user');
    if (!userParam) {
      throw new AppError(401, 'missing_user_data');
    }

    const user = JSON.parse(userParam) as TelegramUser;

    // Check auth_date (valid for 24 hours)
    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      throw new AppError(401, 'auth_data_expired');
    }

    return user;
  }

  /**
   * Authenticate user with Telegram and return JWT tokens
   */
  async authenticateWithTelegram(initData: string) {
    // Verify Telegram hash
    const telegramUser = this.verifyTelegramHash(initData);

    // TODO: Create or update user in database
    // const user = await UserRepository.findOrCreate(telegramUser);

    // Mock user for now
    const userId = uuidv4();
    const isNewUser = true;

    // Generate JWT tokens
    const accessToken = jwt.sign(
      {
        userId,
        telegramId: telegramUser.id,
        username: telegramUser.username,
        isAdmin: false,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiry }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        tokenId: uuidv4(),
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    // TODO: Store refresh token in database

    logger.info('User authenticated', {
      userId,
      telegramId: telegramUser.id,
      isNewUser,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: userId,
      telegram_id: telegramUser.id,
      username: telegramUser.username,
      is_new_user: isNewUser,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;

      // TODO: Verify refresh token exists in database
      // TODO: Get user from database

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
          telegramId: decoded.telegramId,
          username: decoded.username,
          isAdmin: false,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpiry }
      );

      return {
        access_token: accessToken,
        refresh_token: refreshToken, // Keep same refresh token
      };
    } catch (error) {
      throw new AppError(401, 'invalid_refresh_token');
    }
  }
}
