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
  findByRefreshTokenHash,
  findSessionById,
  rotateSessionToken,
  insertRefreshAuditEntry,
  markSessionFamilyRevoked,
  markSessionsRevokedForUser,
  SessionRecord,
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
import { recordSessionFamilyRevocationMetric } from '../metrics/auth';

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
  ip?: string | null;
  userAgent?: string | null;
  origin?: string | null;
}

type RequestContext = Pick<AuthenticateOptions, 'ip' | 'userAgent' | 'origin'>;

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

  private refreshTokenTtlSeconds(): number {
    return Math.floor(durationToMilliseconds(config.jwt.refreshExpiry) / 1000);
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
  ): Promise<'fresh' | 'replay' | 'skipped'> {
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
      return status;
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
      return 'skipped';
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

      let replayStatus: 'fresh' | 'replay' | 'skipped' = 'skipped';
      if (options.enforceReplayProtection) {
        replayStatus = await this.ensureInitDataReplayProtection(initData, {
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

        const playerSession = await ensurePlayerSession(user.id, client);
        let existingSession: SessionRecord | null = null;
        if (playerSession.authSessionId) {
          existingSession = await findSessionById(playerSession.authSessionId, client);
        }

        const now = Date.now();
        const canReuseSession =
          existingSession &&
          !existingSession.revokedAt &&
          existingSession.expiresAt.getTime() > now;
        const reusableSession = canReuseSession ? existingSession : null;
        const sessionFamilyId = reusableSession ? reusableSession.familyId : uuidv4();

        const tokens = this.generateTokens(user);
        const refreshTokenHash = hashToken(tokens.refreshToken);

        let sessionRecord: SessionRecord;
        let sessionRotated = false;

        if (reusableSession && replayStatus === 'replay') {
          sessionRecord = await rotateSessionToken(
            reusableSession.id,
            refreshTokenHash,
            tokens.refreshExpiresAt,
            {
              ip: options.ip ?? null,
              userAgent: options.userAgent ?? null,
            },
            client
          );
          sessionRotated = true;
        } else {
          sessionRecord = await createSession(
            user.id,
            refreshTokenHash,
            tokens.refreshExpiresAt,
            {
              familyId: sessionFamilyId,
              ip: options.ip ?? null,
              userAgent: options.userAgent ?? null,
            },
            client
          );
        }

        await updatePlayerSession(
          user.id,
          {
            authSessionId: sessionRecord.id,
          },
          client
        );
        if (sessionRotated) {
          await logEvent(
            user.id,
            'token_refresh',
            {
              reason: 'tma_replay',
              session_id: sessionRecord.id,
              family_id: sessionRecord.familyId,
            },
            { client }
          );
        } else {
          await logEvent(
            user.id,
            'login',
            {
              telegram_id: telegramUser.id,
              username: telegramUser.username,
              is_new_user: isNewUser,
              replay_status: replayStatus,
            },
            { client }
          );
        }

        return { user, progress, isNewUser, tokens, replayStatus, sessionRotated };
      });

      logger.info(
        {
          userId: result.user.id,
          telegramId: result.user.telegramId,
          isNewUser: result.isNewUser,
          replayStatus: result.replayStatus,
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
        refresh_expires_in: this.refreshTokenTtlSeconds(),
        replay_status: result.replayStatus,
        user_id: result.user.id,
        telegram_id: result.user.telegramId,
        username: result.user.username,
        first_name: result.user.firstName,
        last_name: result.user.lastName,
        is_admin: result.user.isAdmin,
        is_new_user: result.isNewUser,
      };
    } catch (error) {
      let handledError: unknown = error;
      if (handledError instanceof AppError && handledError.message === 'auth_data_expired') {
        handledError = new AppError(handledError.statusCode ?? 401, 'auth_data_expired_renew');
      }

      const reason = handledError instanceof AppError ? handledError.message : 'unexpected_error';
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
      if (handledError instanceof Error) {
        throw handledError;
      }
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string, context: RequestContext = {}) {
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

    if (typeof decoded !== 'object' || typeof decoded.userId !== 'string') {
      throw new AppError(401, 'invalid_refresh_token');
    }

    const decodedUserId = decoded.userId;
    const refreshHash = hashToken(refreshToken);

    const result = await transaction(async client => {
      const recordFamilyRevocation = async ({
        userId,
        familyId,
        trigger,
        revokedCount,
      }: {
        userId: string | null;
        familyId: string | null;
        trigger: string;
        revokedCount: number;
      }) => {
        if (!userId || revokedCount === 0) {
          return;
        }

        try {
          await ensurePlayerSession(userId, client);
          await updatePlayerSession(
            userId,
            {
              authSessionId: null,
            },
            client
          );
        } catch (playerError) {
          logger.warn(
            {
              userId,
              familyId,
              trigger,
              error: playerError instanceof Error ? playerError.message : String(playerError),
            },
            'session_family_revocation_player_session_update_failed'
          );
        }

        try {
          await logEvent(
            userId,
            'session_family_revoked',
            {
              family_id: familyId,
              trigger,
              revoked_count: revokedCount,
            },
            { client }
          );
        } catch (eventError) {
          logger.warn(
            {
              userId,
              familyId,
              trigger,
              error: eventError instanceof Error ? eventError.message : String(eventError),
            },
            'session_family_revocation_event_failed'
          );
        }

        logger.info(
          {
            userId,
            familyId,
            revokedCount,
            trigger,
          },
          'session_family_revoked'
        );

        recordSessionFamilyRevocationMetric(trigger, revokedCount);
      };

      const session = await findByRefreshTokenHash(refreshHash, client);
      if (!session) {
        await insertRefreshAuditEntry(
          {
            sessionId: null,
            userId: decodedUserId,
            familyId: null,
            hashedToken: refreshHash,
            reason: 'not_found',
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            revocationReason: 'auto_revoke_user',
          },
          client
        );
        const revokedCount = await markSessionsRevokedForUser(decodedUserId, client);
        await recordFamilyRevocation({
          userId: decodedUserId,
          familyId: null,
          trigger: 'refresh_not_found',
          revokedCount,
        });
        throw new AppError(401, 'invalid_refresh_token');
      }

      if (session.userId !== decodedUserId) {
        await insertRefreshAuditEntry(
          {
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
            hashedToken: refreshHash,
            reason: 'user_mismatch',
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            revocationReason: 'auto_revoke_user_mismatch',
          },
          client
        );
        const revokedCount = await markSessionFamilyRevoked(session.familyId, client);
        await recordFamilyRevocation({
          userId: session.userId,
          familyId: session.familyId,
          trigger: 'refresh_user_mismatch',
          revokedCount,
        });
        throw new AppError(401, 'invalid_refresh_token');
      }

      if (session.revokedAt) {
        await insertRefreshAuditEntry(
          {
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
            hashedToken: refreshHash,
            reason: 'revoked',
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
          },
          client
        );
        throw new AppError(401, 'invalid_refresh_token');
      }

      if (session.expiresAt.getTime() < Date.now()) {
        await insertRefreshAuditEntry(
          {
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
            hashedToken: refreshHash,
            reason: 'expired',
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            revocationReason: 'auto_revoke_expired',
          },
          client
        );
        const revokedCount = await markSessionFamilyRevoked(session.familyId, client);
        await recordFamilyRevocation({
          userId: session.userId,
          familyId: session.familyId,
          trigger: 'refresh_expired',
          revokedCount,
        });
        throw new AppError(401, 'refresh_token_expired');
      }

      const user = await findUserById(session.userId, client);
      if (!user) {
        await insertRefreshAuditEntry(
          {
            sessionId: session.id,
            userId: session.userId,
            familyId: session.familyId,
            hashedToken: refreshHash,
            reason: 'user_missing',
            ip: context.ip ?? null,
            userAgent: context.userAgent ?? null,
            revocationReason: 'auto_revoke_user_missing',
          },
          client
        );
        const revokedCount = await markSessionFamilyRevoked(session.familyId, client);
        await recordFamilyRevocation({
          userId: session.userId,
          familyId: session.familyId,
          trigger: 'refresh_user_missing',
          revokedCount,
        });
        throw new AppError(404, 'user_not_found');
      }

      await ensurePlayerSession(user.id, client);

      const tokens = this.generateTokens(user);
      const newRefreshHash = hashToken(tokens.refreshToken);

      const rotatedSession = await rotateSessionToken(
        session.id,
        newRefreshHash,
        tokens.refreshExpiresAt,
        {
          ip: context.ip ?? null,
          userAgent: context.userAgent ?? null,
        },
        client
      );
      await updatePlayerSession(
        user.id,
        {
          authSessionId: rotatedSession.id,
        },
        client
      );

      await logEvent(
        user.id,
        'token_refresh',
        {
          session_id: session.id,
          rotated: true,
          reason: 'refresh_endpoint',
        },
        { client }
      );

      return {
        tokens,
        user,
      };
    });

    return {
      access_token: result.tokens.accessToken,
      refresh_token: result.tokens.refreshToken,
      refresh_expires_at: result.tokens.refreshExpiresAt.toISOString(),
      expires_in: this.accessTokenTtlSeconds(),
      refresh_expires_in: this.refreshTokenTtlSeconds(),
    };
  }
}
