/**
 * Authentication Service
 * Handles Telegram OAuth and JWT token generation backed by PostgreSQL sessions
 */

import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { TelegramUser, validateTelegramInitData } from '../utils/telegramAuth';
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
  rotateSessionToken,
} from '../repositories/SessionRepository';
import { logEvent } from '../repositories/EventRepository';
import { transaction } from '../db/connection';
import { addDuration, durationToMilliseconds } from '../utils/time';
import { hashToken } from '../utils/token';
import { registerInitDataHash } from '../cache/telegramInitReplay';
import {
  ensurePlayerSession,
  updatePlayerSession,
} from '../repositories/PlayerSessionRepository';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

interface ParsedTelegramAuth {
  telegramUser: TelegramUser;
  matchedBotToken: string | null;
}

interface AuthenticateOptions {
  enforceReplayProtection?: boolean;
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

  private parseInitData(initData: string): ParsedTelegramAuth {
    if (config.testing.bypassAuth) {
      try {
        const parsed = JSON.parse(initData) as Partial<TelegramUser>;
        if (!parsed.id) {
          throw new Error('id is required');
        }
        logger.debug(
          {
            userId: parsed.id,
            username: parsed.username,
          },
          'bypass_auth_payload_used'
        );
        return {
          telegramUser: {
            id: parsed.id,
            first_name: parsed.first_name || 'Test',
            last_name: parsed.last_name,
            username: parsed.username || `test_${parsed.id}`,
            photo_url: parsed.photo_url,
            auth_date: Math.floor(Date.now() / 1000),
            hash: '',
          },
          matchedBotToken: null,
        };
      } catch (error) {
        logger.warn(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          'bypass_auth_payload_parse_failed'
        );
        return {
          telegramUser: {
            id: Math.floor(Math.random() * 1_000_000),
            first_name: 'Test',
            username: 'test_user',
            auth_date: Math.floor(Date.now() / 1000),
            hash: '',
          },
          matchedBotToken: null,
        };
      }
    }

    return validateTelegramInitData(initData, config.telegram.botTokens);
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

  private async ensureInitDataReplayProtection(
    initData: string,
    context: {
      telegramUserId: number | null;
      matchedBotToken: string | null;
      initDataLength: number;
    }
  ) {
    const ttlSeconds = Math.max(config.telegram.authDataMaxAgeSec, 0);
    const initDataHash = hashToken(initData);
    try {
      const status = await registerInitDataHash(initDataHash, ttlSeconds);

      if (status === 'replay') {
        logger.warn(
          {
            initDataHash,
            ttlSeconds,
            telegramUserId: context.telegramUserId,
            matchedBotToken: context.matchedBotToken
              ? `${context.matchedBotToken.slice(0, 6)}...${context.matchedBotToken.slice(-4)}`
              : null,
          },
          'telegram_initdata_replay_detected'
        );
        throw new AppError(409, 'telegram_initdata_replayed');
      }

      if (status === 'skipped') {
        logger.debug(
          {
            reason: 'cache_disabled_or_unavailable',
            ttlSeconds,
            initDataLength: context.initDataLength,
            telegramUserId: context.telegramUserId,
          },
          'telegram_initdata_replay_skip'
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
          initDataHash,
          telegramUserId: context.telegramUserId,
          initDataLength: context.initDataLength,
        },
        'telegram_initdata_replay_degraded'
      );
    }
  }

  async authenticateWithTelegram(initData: string, options: AuthenticateOptions = {}) {
    const initDataLength = initData.length;
    let matchedBotToken: string | null = null;
    let telegramUserId: number | null = null;

    try {
      const { telegramUser, matchedBotToken: parsedToken } = this.parseInitData(initData);
      matchedBotToken = parsedToken;
      telegramUserId = telegramUser.id;

      if (options.enforceReplayProtection) {
        await this.ensureInitDataReplayProtection(initData, {
          telegramUserId,
          matchedBotToken,
          initDataLength,
        });
      }

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

        const progress =
          (await getProgress(user.id, client)) ?? (await createDefaultProgress(user.id, client));

        await ensureProfile(user.id, client);

        await ensurePlayerSession(user.id, client);

        const tokens = this.generateTokens(user);
        const refreshTokenHash = hashToken(tokens.refreshToken);

        await deleteSessionByHash(refreshTokenHash, client);
        const sessionRecord = await createSession(
          user.id,
          refreshTokenHash,
          tokens.refreshExpiresAt,
          client
        );
        await updatePlayerSession(
          user.id,
          {
            authSessionId: sessionRecord.id,
          },
          client
        );
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

      logger.info(
        {
          userId: result.user.id,
          telegramId: result.user.telegramId,
          isNewUser: result.isNewUser,
          initDataLength,
          botToken: matchedBotToken
            ? `${matchedBotToken.slice(0, 6)}...${matchedBotToken.slice(-4)}`
            : null,
        },
        'user_authenticated'
      );

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
        is_admin: result.user.isAdmin,
        is_new_user: result.isNewUser,
      };
    } catch (error) {
      const reason = error instanceof AppError ? error.message : 'unexpected_error';
      logger.warn(
        {
          reason,
          initDataLength,
          telegramUserId,
          botToken: matchedBotToken
            ? `${matchedBotToken.slice(0, 6)}...${matchedBotToken.slice(-4)}`
            : null,
        },
        'telegram_authentication_failed'
      );
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    let decoded: JwtPayload | string;

    try {
      decoded = jwt.verify(refreshToken, this.jwtSecret);
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'refresh_token_verification_failed'
      );
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

    await ensurePlayerSession(user.id);

    const tokens = this.generateTokens(user);
    const newRefreshHash = hashToken(tokens.refreshToken);

    const rotatedSession = await rotateSessionToken(session.id, newRefreshHash, tokens.refreshExpiresAt);
    await updatePlayerSession(user.id, {
      authSessionId: rotatedSession.id,
    });
    const refreshResult = {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      refresh_expires_at: tokens.refreshExpiresAt.toISOString(),
      expires_in: this.accessTokenTtlSeconds(),
    };

    await logEvent(user.id, 'token_refresh', {
      session_id: session.id,
      rotated: true,
    });

    return refreshResult;
  }
}
