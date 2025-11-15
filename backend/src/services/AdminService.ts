/**
 * Admin Service
 * Provides operational insights for migrations and infrastructure health
 */

import fs from 'fs/promises';
import path from 'path';
import { QueryResultRow } from 'pg';
import { query, transaction } from '../db/connection';
import { healthCheck as databaseHealthCheck } from '../db/connection';
import { healthCheck as redisHealthCheck } from '../cache/redis';
import { logger } from '../utils/logger';
import {
  getSessionFamilySummary,
  listSessionFamilies,
  markSessionFamilyRevoked,
  insertRefreshAuditEntry,
} from '../repositories/SessionRepository';
import { ensurePlayerSession, updatePlayerSession } from '../repositories/PlayerSessionRepository';
import { logEvent } from '../repositories/EventRepository';
import { recordSessionFamilyRevocationMetric } from '../metrics/auth';

interface MigrationRow extends QueryResultRow {
  version: string;
  name: string;
  applied_at: Date;
}

export interface MigrationStatus {
  applied: number;
  pending: number;
  lastAppliedAt: string | null;
  migrations: {
    version: string;
    name: string;
    applied: boolean;
    appliedAt: string | null;
  }[];
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  checks: {
    database: {
      status: 'ok' | 'degraded';
      latencyMs: number | null;
    };
    redis: {
      status: 'ok' | 'degraded';
      latencyMs: number | null;
    };
    migrations: {
      status: 'ok' | 'degraded';
      applied: number;
      pending: number;
      lastAppliedAt: string | null;
    };
  };
  timestamp: string;
}

export interface SeasonLeaderboardEntry {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  finalRank: number | null;
  finalElo: number | null;
  finalTier: string | null;
  rewardTier: 'gold' | 'silver' | 'bronze';
  couponCode: string | null;
  rewards: Record<string, unknown>;
  claimed: boolean;
  claimedAt: string | null;
  energyTotal: number;
}

export interface SeasonSnapshot {
  seasonId: string;
  seasonNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  rewards: Record<string, unknown>;
  leaderboard: SeasonLeaderboardEntry[];
  generatedAt: string;
}

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

const hasErrorCode = (error: unknown, code: string): boolean => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === code;
};

const toIsoString = (value: string | Date | null | undefined): string => {
  if (!value) {
    return new Date(0).toISOString();
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

interface SeasonSnapshotRow extends QueryResultRow {
  season_id: string | null;
  season_number: number | null;
  season_name: string | null;
  start_time: string | Date | null;
  end_time: string | Date | null;
  is_active: boolean | null;
  season_rewards: Record<string, unknown> | null;
  user_id: string | null;
  final_rank: number | null;
  final_elo: number | null;
  final_tier: string | null;
  reward_payload: Record<string, unknown> | null;
  claimed: boolean | null;
  claimed_at: string | Date | null;
  reward_tier: string | null;
  reward_coupon_code: string | null;
  energy_total: number | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export class AdminService {
  async getMigrationStatus(): Promise<MigrationStatus> {
    const migrationFiles = await this.readMigrationFiles();
    const appliedRows = await this.fetchAppliedMigrations();

    const appliedVersions = new Set(appliedRows.map(row => row.version));
    const migrations = migrationFiles.map(file => {
      const applied = appliedVersions.has(file.version);
      const appliedRow = appliedRows.find(row => row.version === file.version) ?? null;

      return {
        version: file.version,
        name: file.name,
        applied,
        appliedAt: appliedRow?.applied_at ? appliedRow.applied_at.toISOString() : null,
      };
    });

    const applied = migrations.filter(m => m.applied).length;
    const pending = migrations.length - applied;
    const lastAppliedAt =
      appliedRows.length > 0
        ? appliedRows
            .slice()
            .sort((a, b) => (a.applied_at > b.applied_at ? -1 : 1))[0]
            .applied_at.toISOString()
        : null;

    return {
      applied,
      pending,
      lastAppliedAt,
      migrations,
    };
  }

  async getFullHealthStatus(): Promise<HealthStatus> {
    const migrationStatus = await this.getMigrationStatus();

    const [dbResult, redisResult] = await Promise.all([
      this.measureAsync(databaseHealthCheck),
      this.measureAsync(redisHealthCheck),
    ]);

    const databaseStatus = dbResult.success ? 'ok' : 'degraded' as const;
    const redisStatus = redisResult.success ? 'ok' : 'degraded' as const;
    const migrationsStatus = migrationStatus.pending === 0 ? 'ok' : 'degraded';
    const overallStatus: 'ok' | 'degraded' =
      databaseStatus === 'ok' && redisStatus === 'ok' && migrationsStatus === 'ok'
        ? 'ok'
        : 'degraded';

    return {
      status: overallStatus,
      checks: {
        database: {
          status: databaseStatus,
          latencyMs: dbResult.latencyMs,
        },
        redis: {
          status: redisStatus,
          latencyMs: redisResult.latencyMs,
        },
        migrations: {
          status: migrationsStatus,
          applied: migrationStatus.applied,
          pending: migrationStatus.pending,
          lastAppliedAt: migrationStatus.lastAppliedAt,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getLatestSeasonSnapshot(): Promise<SeasonSnapshot | null> {
    const result = await query<SeasonSnapshotRow>(
      `
        WITH latest_season AS (
          SELECT *
          FROM arena_seasons
          ORDER BY is_active DESC, end_time DESC
          LIMIT 1
        )
        SELECT
          s.id AS season_id,
          s.season_number,
          s.name AS season_name,
          s.start_time,
          s.end_time,
          s.is_active,
          s.rewards AS season_rewards,
          r.user_id,
          r.final_rank,
          r.final_elo,
          r.final_tier,
          r.rewards AS reward_payload,
          r.claimed,
          r.claimed_at,
          r.reward_tier,
          r.reward_coupon_code,
          r.energy_total,
          u.username,
          u.first_name,
          u.last_name
        FROM latest_season s
        LEFT JOIN LATERAL (
          SELECT
            asr.user_id,
            asr.final_rank,
            asr.final_elo,
            asr.final_tier,
            asr.rewards,
            asr.claimed,
            asr.claimed_at,
            CASE
              WHEN asr.final_rank = 1 THEN 'gold'
              WHEN asr.final_rank = 2 THEN 'silver'
              WHEN asr.final_rank = 3 THEN 'bronze'
              ELSE 'custom'
            END AS reward_tier,
            COALESCE(asr.rewards->>'coupon_code', NULL) AS reward_coupon_code,
            COALESCE((asr.rewards->>'energy_total')::bigint, 0) AS energy_total
          FROM arena_season_rewards asr
          WHERE asr.season_id = s.id
          ORDER BY asr.final_rank ASC NULLS LAST, asr.created_at ASC
          LIMIT 3
        ) r ON TRUE
        LEFT JOIN users u ON u.id = r.user_id;
      `
    );

    if (result.rowCount === 0) {
      return null;
    }

    const firstRow = result.rows[0];
    if (!firstRow?.season_id) {
      return null;
    }

    const rewardsPayload = isPlainRecord(firstRow.season_rewards)
      ? firstRow.season_rewards
      : {};

    const leaderboard = result.rows
      .filter(
        (row): row is SeasonSnapshotRow & { user_id: string } =>
          typeof row.user_id === 'string' && row.user_id.length > 0
      )
      .map(row => {
        const rankBasedTier =
          row.final_rank === 1 ? 'gold' : row.final_rank === 2 ? 'silver' : 'bronze';
        const rewardTier =
          row.reward_tier === 'gold' || row.reward_tier === 'silver' || row.reward_tier === 'bronze'
            ? (row.reward_tier as 'gold' | 'silver' | 'bronze')
            : rankBasedTier;
        const rewardPayload = isPlainRecord(row.reward_payload) ? row.reward_payload : {};

        return {
          userId: row.user_id,
          username: row.username ?? null,
          firstName: row.first_name ?? null,
          lastName: row.last_name ?? null,
          finalRank: row.final_rank ?? null,
          finalElo: row.final_elo ?? null,
          finalTier: row.final_tier ?? null,
          rewardTier,
          couponCode: row.reward_coupon_code ?? null,
          rewards: rewardPayload,
          claimed: Boolean(row.claimed),
          claimedAt: row.claimed_at ? toIsoString(row.claimed_at) : null,
          energyTotal: typeof row.energy_total === 'number' ? row.energy_total : 0,
        };
      });

    return {
      seasonId: firstRow.season_id,
      seasonNumber: firstRow.season_number ?? 0,
      name: firstRow.season_name ?? 'Unknown season',
      startTime: toIsoString(firstRow.start_time),
      endTime: toIsoString(firstRow.end_time),
      isActive: Boolean(firstRow.is_active),
      rewards: rewardsPayload,
      leaderboard,
      generatedAt: new Date().toISOString(),
    };
  }

  async listAuthSessionFamilies(options: { userId?: string; limit?: number; offset?: number } = {}) {
    return listSessionFamilies(options);
  }

  async revokeSessionFamily(familyId: string, reason?: string) {
    return transaction(async client => {
      const summary = await getSessionFamilySummary(familyId, client);

      if (!summary) {
        return {
          familyId,
          revokedCount: 0,
          userId: null,
        };
      }

      const revokedCount = await markSessionFamilyRevoked(familyId, client);
      if (revokedCount === 0) {
        return {
          familyId,
          revokedCount,
          userId: summary.userId,
        };
      }

      const revocationLabel = reason?.trim() || 'manual_revoke';

      await insertRefreshAuditEntry(
        {
          sessionId: null,
          userId: summary.userId,
          familyId,
          hashedToken: revocationLabel,
          reason: 'manual_revoke',
          ip: null,
          userAgent: null,
          revocationReason: revocationLabel,
        },
        client
      );

      try {
        await ensurePlayerSession(summary.userId, client);
        await updatePlayerSession(
          summary.userId,
          {
            authSessionId: null,
          },
          client
        );
      } catch (playerError) {
        logger.warn(
          {
            familyId,
            userId: summary.userId,
            error: playerError instanceof Error ? playerError.message : String(playerError),
          },
          'admin_session_family_revoke_player_session_failed'
        );
      }

      try {
        await logEvent(
          summary.userId,
          'session_family_revoked',
          {
            family_id: familyId,
            trigger: revocationLabel,
            revoked_count: revokedCount,
            initiated_by: 'admin',
          },
          { client }
        );
      } catch (eventError) {
        logger.warn(
          {
            familyId,
            userId: summary.userId,
            error: eventError instanceof Error ? eventError.message : String(eventError),
          },
          'admin_session_family_revoke_event_failed'
        );
      }

      logger.info(
        {
          familyId,
          userId: summary.userId,
          revokedCount,
          reason: revocationLabel,
        },
        'admin_session_family_revoked'
      );

      recordSessionFamilyRevocationMetric(revocationLabel, revokedCount);

      return {
        familyId,
        revokedCount,
        userId: summary.userId,
        reason: revocationLabel,
        lastUsedAt: summary.lastUsedAt ? summary.lastUsedAt.toISOString() : null,
      };
    });
  }

  async rewardSeasonPlacement(params: {
    seasonId: string;
    userId: string;
    rewardTier: 'gold' | 'silver' | 'bronze';
    couponCode?: string | null;
    note?: string | null;
    message?: string | null;
    grantedBy?: string | null;
  }): Promise<{ rewardId: string | null }> {
    const rewardPayload = {
      reward_tier: params.rewardTier,
      coupon_code: params.couponCode ?? null,
      note: params.note ?? null,
      message: params.message ?? null,
      granted_by: params.grantedBy ?? null,
      granted_at: new Date().toISOString(),
    };

    const inferredRank =
      params.rewardTier === 'gold' ? 1 : params.rewardTier === 'silver' ? 2 : 3;

    return transaction(async client => {
      const upsertResult = await client.query<{ id: string }>(
        `
          INSERT INTO arena_season_rewards (season_id, user_id, final_rank, final_elo, final_tier, rewards, claimed, claimed_at)
          VALUES ($1, $2, $3, NULL, NULL, $4::jsonb, TRUE, NOW())
          ON CONFLICT (season_id, user_id)
          DO UPDATE SET
            claimed = TRUE,
            claimed_at = NOW(),
            rewards = COALESCE(arena_season_rewards.rewards, '{}'::jsonb) || EXCLUDED.rewards,
            final_rank = COALESCE(arena_season_rewards.final_rank, EXCLUDED.final_rank),
            final_tier = COALESCE(arena_season_rewards.final_tier, EXCLUDED.final_tier)
          RETURNING id
        `,
        [params.seasonId, params.userId, inferredRank, JSON.stringify(rewardPayload)]
      );

      await logEvent(
        params.userId,
        'season_reward_granted',
        {
          season_id: params.seasonId,
          reward_tier: params.rewardTier,
          coupon_code: params.couponCode ?? null,
          note: params.note ?? null,
          message: params.message ?? null,
          granted_by: params.grantedBy ?? null,
        },
        { client }
      );

      return {
        rewardId: upsertResult.rows[0]?.id ?? null,
      };
    });
  }

  private async readMigrationFiles(): Promise<{ version: string; name: string }[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(MIGRATIONS_DIR);
    } catch (error: unknown) {
      if (hasErrorCode(error, 'ENOENT')) {
        logger.warn({ directory: MIGRATIONS_DIR }, 'migrations_directory_missing');
        return [];
      }
      throw error;
    }
    return entries
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const match = file.match(/^(\d{3})_(.+)\.sql$/);
        if (!match) {
          logger.warn({ file }, 'migrations_file_unexpected');
          return null;
        }
        return { version: match[1], name: match[2] };
      })
      .filter((entry): entry is { version: string; name: string } => entry !== null)
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  private async fetchAppliedMigrations(): Promise<MigrationRow[]> {
    try {
      const result = await query<MigrationRow>(
        'SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC'
      );
      return result.rows;
    } catch (error: unknown) {
      if (hasErrorCode(error, '42P01')) {
        logger.warn({ table: 'schema_migrations' }, 'schema_migrations_missing_during_status');
        return [];
      }
      throw error;
    }
  }

  private async measureAsync(checkFn: () => Promise<boolean>): Promise<{
    success: boolean;
    latencyMs: number | null;
  }> {
    const start = Date.now();
    try {
      const success = await checkFn();
      return { success, latencyMs: Date.now() - start };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          source: checkFn.name || 'unknown',
        },
        'admin_healthcheck_failed'
      );
      return { success: false, latencyMs: null };
    }
  }
}
