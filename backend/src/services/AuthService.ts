/**
 * Authentication Service
 * Handles Telegram OAuth and JWT token generation backed by PostgreSQL sessions
 */

import crypto from 'crypto';
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  createUser,
  findById as findUserById,
  findByTelegramId,
  updateUser,
  UserRecord,
} from '../repositories/UserRepository';
import { createDefaultProgress, getProgress } from '../repositories/ProgressRepository';
import { ensureProfile } from '../repositories/ProfileRepository';
import {
  createSession,
  deleteSessionByHash,
  findByRefreshTokenHash,
  updateSessionExpiry,
} from '../repositories/SessionRepository';
import { logEvent } from '../repositories/EventRepository';
import { transaction } from '../db/connection';
import { addDuration, durationToMilliseconds } from '../utils/time';
import { hashToken } from '../utils/token';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export class AuthService {
  private readonly jwtSecret: Secret = config.jwt.secret as Secret;

  private buildAccessPayload(user: UserRecord) {
    return {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username,
      isAdmin: user.isAdmin,
    };
  }

  private signAccessToken(user: UserRecord): string {
    const options: SignOptions = {
      expiresIn: config.jwt.accessExpiry as SignOptions['expiresIn'],
    };
    return jwt.sign(this.buildAccessPayload(user), this.jwtSecret, options);
  }

  private accessTokenTtlSeconds(): number {
    return Math.floor(durationToMilliseconds(config.jwt.accessExpiry) / 1000);
  }

  private verifyTelegramHash(initData: string): TelegramUser {
    const botTokens = config.telegram.botTokens;

    if (!botTokens.length) {
      throw new AppError(500, 'telegram_bot_token_missing');
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    const mask = (value: string | null) => {
      if (!value) {
        return null;
      }
      if (value.length <= 8) {
        return value;
      }
      return `${value.slice(0, 6)}...${value.slice(-4)}`;
    };

    const maskedTokens = botTokens.map(mask);

    logger.debug('Telegram init data received', {
      initDataLength: initData.length,
      keys: Array.from(urlParams.keys()),
      hashPresent: Boolean(hash),
      botTokenSnippets: maskedTokens,
    });

    if (!hash) {
      logger.warn('Telegram init data missing hash', {
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
      });
      throw new AppError(401, 'missing_telegram_hash');
    }

    const entries = Array.from(urlParams.entries());
    const filteredEntries = entries.filter(([key]) => key !== 'hash');

    const buildDataCheckString = (source: [string, string][]) =>
      source
        .slice()
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const defaultDataCheckString = buildDataCheckString(filteredEntries);
    const withoutSignatureDataCheckString = buildDataCheckString(
      filteredEntries.filter(([key]) => key !== 'signature')
    );

    let matchedVariant: 'default' | 'no_signature' | null = null;
    let matchedToken: string | null = null;
    let lastExpectedDefault: string | null = null;
    let lastExpectedWithoutSignature: string | null = null;

    for (const candidateToken of botTokens) {
      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(candidateToken).digest();

      const calculateHash = (data: string) =>
        crypto.createHmac('sha256', secretKey).update(data).digest('hex');

      const calculatedHashDefault = calculateHash(defaultDataCheckString);
      const calculatedHashWithoutSignature = calculateHash(withoutSignatureDataCheckString);

      lastExpectedDefault = calculatedHashDefault;
      lastExpectedWithoutSignature = calculatedHashWithoutSignature;

      if (calculatedHashDefault === hash) {
        matchedVariant = 'default';
        matchedToken = candidateToken;
        break;
      }

      if (calculatedHashWithoutSignature === hash) {
        matchedVariant = 'no_signature';
        matchedToken = candidateToken;
        break;
      }

      logger.debug('Telegram hash mismatch for candidate token', {
        providedHash: mask(hash),
        expectedHashDefault: mask(calculatedHashDefault),
        expectedHashWithoutSignature: mask(calculatedHashWithoutSignature),
        candidateToken: mask(candidateToken),
      });
    }

    if (!matchedVariant || !matchedToken) {
      logger.error('Telegram hash validation failed', {
        providedHash: mask(hash),
        expectedHashDefault: mask(lastExpectedDefault),
        expectedHashWithoutSignature: mask(lastExpectedWithoutSignature),
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
        botTokenConfigured: Boolean(config.telegram.botToken),
        botTokenCandidates: maskedTokens,
      });
      throw new AppError(401, 'invalid_telegram_hash');
    }

    if (matchedVariant === 'no_signature') {
      logger.info('Telegram hash matched after removing signature key', {
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
        botTokenUsed: mask(matchedToken),
      });
    } else {
      logger.debug('Telegram hash matched with default payload', {
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
        botTokenUsed: mask(matchedToken),
      });
    }

    const userParam = urlParams.get('user');
    if (!userParam) {
      logger.warn('Telegram init data missing user payload', {
        keys: Array.from(urlParams.keys()),
      });
      throw new AppError(401, 'missing_user_data');
    }

    const parsed = JSON.parse(userParam) as TelegramUser;

    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      logger.warn('Telegram auth data expired', {
        authDate,
        now,
        ageSeconds: now - authDate,
      });
      throw new AppError(401, 'auth_data_expired');
    }

    return parsed;
  }

  private parseInitData(initData: string): TelegramUser {
    if (config.testing.bypassAuth) {
      try {
        const parsed = JSON.parse(initData) as Partial<TelegramUser>;
        if (!parsed.id) {
          throw new Error('id is required');
        }
        logger.debug('Bypass auth using provided JSON payload', {
          userId: parsed.id,
          username: parsed.username,
        });
        return {
          id: parsed.id,
          first_name: parsed.first_name || 'Test',
          last_name: parsed.last_name,
          username: parsed.username || `test_${parsed.id}`,
          photo_url: parsed.photo_url,
          auth_date: Math.floor(Date.now() / 1000),
          hash: '',
        };
      } catch (error) {
        logger.warn('Bypass auth JSON parse failed, using fallback profile', error);
        return {
          id: Math.floor(Math.random() * 1_000_000),
          first_name: 'Test',
          username: 'test_user',
          auth_date: Math.floor(Date.now() / 1000),
          hash: '',
        };
      }
    }

    return this.verifyTelegramHash(initData);
  }

  private generateTokens(user: UserRecord): AuthTokens {
    const accessToken = this.signAccessToken(user);

    const refreshPayload: JwtPayload = {
      userId: user.id,
      telegramId: user.telegramId,
      tokenId: uuidv4(),
    };
    const refreshOptions: SignOptions = {
      expiresIn: config.jwt.refreshExpiry as SignOptions['expiresIn'],
    };
    const refreshToken = jwt.sign(refreshPayload, this.jwtSecret, refreshOptions);

    const refreshExpiresAt = addDuration(new Date(), config.jwt.refreshExpiry);

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  async authenticateWithTelegram(initData: string) {
    const telegramUser = this.parseInitData(initData);

    const result = await transaction(async client => {
      let user = await findByTelegramId(telegramUser.id, client);
      let isNewUser = false;

      if (!user) {
        user = await createUser(
          {
            telegramId: telegramUser.id,
            username: telegramUser.username,
            firstName: telegramUser.first_name,
            lastName: telegramUser.last_name,
          },
          client
        );
        await createDefaultProgress(user.id, client);
        await ensureProfile(user.id, client);
        isNewUser = true;
      } else {
        const shouldUpdate =
          user.username !== (telegramUser.username ?? null) ||
          user.firstName !== (telegramUser.first_name ?? null) ||
          user.lastName !== (telegramUser.last_name ?? null);

        if (shouldUpdate) {
          user = await updateUser(
            user.id,
            {
              username: telegramUser.username ?? null,
              firstName: telegramUser.first_name ?? null,
              lastName: telegramUser.last_name ?? null,
            },
            client
          );
        }
      }

      const progress = (await getProgress(user.id, client)) ?? (await createDefaultProgress(user.id, client));

      await ensureProfile(user.id, client);

      const tokens = this.generateTokens(user);
      const refreshTokenHash = hashToken(tokens.refreshToken);

      await deleteSessionByHash(refreshTokenHash, client);
      await createSession(user.id, refreshTokenHash, tokens.refreshExpiresAt, client);
      await logEvent(
        user.id,
        'login',
        {
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          is_new_user: isNewUser,
        },
        { client }
      );

      return { user, progress, isNewUser, tokens };
    });

    logger.info('User authenticated', {
      userId: result.user.id,
      telegramId: result.user.telegramId,
      isNewUser: result.isNewUser,
    });

    return {
      access_token: result.tokens.accessToken,
      refresh_token: result.tokens.refreshToken,
      refresh_expires_at: result.tokens.refreshExpiresAt.toISOString(),
      expires_in: this.accessTokenTtlSeconds(),
      user_id: result.user.id,
      telegram_id: result.user.telegramId,
      username: result.user.username,
      first_name: result.user.firstName,
      last_name: result.user.lastName,
      is_new_user: result.isNewUser,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    let decoded: JwtPayload | string;

    try {
      decoded = jwt.verify(refreshToken, this.jwtSecret);
    } catch (error) {
      logger.warn('Invalid refresh token', error);
      throw new AppError(401, 'invalid_refresh_token');
    }

    if (typeof decoded !== 'object' || !decoded.userId) {
      throw new AppError(401, 'invalid_refresh_token');
    }

    const refreshHash = hashToken(refreshToken);
    const session = await findByRefreshTokenHash(refreshHash);

    if (!session) {
      throw new AppError(401, 'invalid_refresh_token');
    }

    if (session.userId !== decoded.userId) {
      await deleteSessionByHash(refreshHash);
      throw new AppError(401, 'invalid_refresh_token');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await deleteSessionByHash(refreshHash);
      throw new AppError(401, 'refresh_token_expired');
    }

    const user = await findUserById(session.userId);
    if (!user) {
      await deleteSessionByHash(refreshHash);
      throw new AppError(404, 'user_not_found');
    }

    const accessToken = this.signAccessToken(user);
    const refreshExpiresAt = addDuration(new Date(), config.jwt.refreshExpiry);

    await updateSessionExpiry(session.id, refreshExpiresAt);
    const refreshResult = {
      access_token: accessToken,
      refresh_token: refreshToken,
      refresh_expires_at: refreshExpiresAt.toISOString(),
      expires_in: this.accessTokenTtlSeconds(),
    };

    await logEvent(user.id, 'token_refresh', { session_id: session.id });

    return refreshResult;
  }
}
