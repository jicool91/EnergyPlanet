/**
 * Season Repository
 * Manages season progress, rewards, and events for players
 */

import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface SeasonProgressRecord {
  id: string;
  userId: string;
  seasonId: string;
  seasonXp: number;
  seasonEnergyProduced: number;
  leaderboardRank: number | null;
  claimedLeaderboardReward: boolean;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeasonRewardRecord {
  id: string;
  userId: string;
  seasonId: string;
  rewardType: string; // leaderboard, event, battle_pass
  rewardTier: string | null; // gold, silver, bronze, top10, etc.
  finalRank: number | null;
  rewardPayload: Record<string, unknown>;
  claimed: boolean;
  claimedAt: Date | null;
  createdAt: Date;
}

export interface SeasonEventRecord {
  id: string;
  userId: string;
  seasonId: string;
  eventId: string;
  participated: boolean;
  rewardClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SeasonProgressRow {
  id: string;
  user_id: string;
  season_id: string;
  season_xp: string;
  season_energy_produced: string;
  leaderboard_rank: number | null;
  claimed_leaderboard_reward: boolean;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SeasonRewardRow {
  id: string;
  user_id: string;
  season_id: string;
  reward_type: string;
  reward_tier: string | null;
  final_rank: number | null;
  reward_payload: unknown;
  claimed: boolean;
  claimed_at: string | null;
  created_at: string;
}

interface SeasonEventRow {
  id: string;
  user_id: string;
  season_id: string;
  event_id: string;
  participated: boolean;
  reward_claimed: boolean;
  created_at: string;
  updated_at: string;
}

function mapSeasonProgress(row: SeasonProgressRow): SeasonProgressRecord {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    seasonXp: Number(row.season_xp),
    seasonEnergyProduced: Number(row.season_energy_produced),
    leaderboardRank: row.leaderboard_rank,
    claimedLeaderboardReward: row.claimed_leaderboard_reward,
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapSeasonReward(row: SeasonRewardRow): SeasonRewardRecord {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    rewardType: row.reward_type,
    rewardTier: row.reward_tier,
    finalRank: row.final_rank,
    rewardPayload:
      typeof row.reward_payload === 'object' && row.reward_payload !== null
        ? (row.reward_payload as Record<string, unknown>)
        : {},
    claimed: row.claimed,
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : null,
    createdAt: new Date(row.created_at),
  };
}

function mapSeasonEvent(row: SeasonEventRow): SeasonEventRecord {
  return {
    id: row.id,
    userId: row.user_id,
    seasonId: row.season_id,
    eventId: row.event_id,
    participated: row.participated,
    rewardClaimed: row.reward_claimed,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// =============================================================================
// SEASON PROGRESS
// =============================================================================

/**
 * Get season progress for a user
 */
export async function getSeasonProgress(
  userId: string,
  seasonId: string,
  client?: PoolClient
): Promise<SeasonProgressRecord | null> {
  const result = await runQuery<SeasonProgressRow>(
    `SELECT * FROM season_progress WHERE user_id = $1 AND season_id = $2`,
    [userId, seasonId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapSeasonProgress(result.rows[0]);
}

/**
 * Create or update season progress
 */
export async function upsertSeasonProgress(
  userId: string,
  seasonId: string,
  updates: {
    seasonXp?: number;
    seasonEnergyProduced?: number;
    leaderboardRank?: number | null;
  },
  client?: PoolClient
): Promise<SeasonProgressRecord> {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [userId, seasonId];
  let paramIndex = 3;

  if (updates.seasonXp !== undefined) {
    setClauses.push(`season_xp = $${paramIndex++}`);
    values.push(updates.seasonXp);
  }

  if (updates.seasonEnergyProduced !== undefined) {
    setClauses.push(`season_energy_produced = $${paramIndex++}`);
    values.push(updates.seasonEnergyProduced);
  }

  if (updates.leaderboardRank !== undefined) {
    setClauses.push(`leaderboard_rank = $${paramIndex++}`);
    values.push(updates.leaderboardRank);
  }

  const setClause = setClauses.length > 0 ? setClauses.join(', ') : 'updated_at = NOW()';

  const result = await runQuery<SeasonProgressRow>(
    `INSERT INTO season_progress (user_id, season_id, season_xp, season_energy_produced, leaderboard_rank)
     VALUES ($1, $2, COALESCE($3, 0), COALESCE($4, 0), $5)
     ON CONFLICT (user_id, season_id)
     DO UPDATE SET ${setClause}
     RETURNING *`,
    [userId, seasonId, updates.seasonXp ?? 0, updates.seasonEnergyProduced ?? 0, updates.leaderboardRank ?? null],
    client
  );

  return mapSeasonProgress(result.rows[0]);
}

/**
 * Increment season XP
 */
export async function incrementSeasonXp(
  userId: string,
  seasonId: string,
  xpAmount: number,
  client?: PoolClient
): Promise<SeasonProgressRecord> {
  const result = await runQuery<SeasonProgressRow>(
    `INSERT INTO season_progress (user_id, season_id, season_xp, season_energy_produced)
     VALUES ($1, $2, $3, 0)
     ON CONFLICT (user_id, season_id)
     DO UPDATE SET season_xp = season_progress.season_xp + $3
     RETURNING *`,
    [userId, seasonId, xpAmount],
    client
  );

  return mapSeasonProgress(result.rows[0]);
}

/**
 * Increment season energy produced
 */
export async function incrementSeasonEnergy(
  userId: string,
  seasonId: string,
  energyAmount: number,
  client?: PoolClient
): Promise<SeasonProgressRecord> {
  const result = await runQuery<SeasonProgressRow>(
    `INSERT INTO season_progress (user_id, season_id, season_xp, season_energy_produced)
     VALUES ($1, $2, 0, $3)
     ON CONFLICT (user_id, season_id)
     DO UPDATE SET season_energy_produced = season_progress.season_energy_produced + $3
     RETURNING *`,
    [userId, seasonId, energyAmount],
    client
  );

  return mapSeasonProgress(result.rows[0]);
}

/**
 * Get season leaderboard (top N players by energy produced)
 */
export async function getSeasonLeaderboard(
  seasonId: string,
  limit: number = 100,
  client?: PoolClient
): Promise<Array<SeasonProgressRecord & { username: string | null; firstName: string | null }>> {
  const result = await runQuery<SeasonProgressRow & { username: string | null; first_name: string | null }>(
    `SELECT sp.*, u.username, u.first_name
     FROM season_progress sp
     JOIN users u ON sp.user_id = u.id
     WHERE sp.season_id = $1
     ORDER BY sp.season_energy_produced DESC
     LIMIT $2`,
    [seasonId, limit],
    client
  );

  return result.rows.map(row => ({
    ...mapSeasonProgress(row),
    username: row.username,
    firstName: row.first_name,
  }));
}

// =============================================================================
// SEASON REWARDS
// =============================================================================

/**
 * Get season rewards for a user
 */
export async function getSeasonRewards(
  userId: string,
  seasonId: string,
  client?: PoolClient
): Promise<SeasonRewardRecord[]> {
  const result = await runQuery<SeasonRewardRow>(
    `SELECT * FROM season_rewards WHERE user_id = $1 AND season_id = $2 ORDER BY created_at DESC`,
    [userId, seasonId],
    client
  );

  return result.rows.map(mapSeasonReward);
}

/**
 * Create season reward
 */
export async function createSeasonReward(
  userId: string,
  seasonId: string,
  rewardType: string,
  rewardTier: string | null,
  finalRank: number | null,
  rewardPayload: Record<string, unknown>,
  client?: PoolClient
): Promise<SeasonRewardRecord> {
  const result = await runQuery<SeasonRewardRow>(
    `INSERT INTO season_rewards (user_id, season_id, reward_type, reward_tier, final_rank, reward_payload, claimed, claimed_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, FALSE, NULL)
     ON CONFLICT (user_id, season_id, reward_type)
     DO UPDATE SET
       reward_tier = EXCLUDED.reward_tier,
       final_rank = EXCLUDED.final_rank,
       reward_payload = EXCLUDED.reward_payload
     RETURNING *`,
    [userId, seasonId, rewardType, rewardTier, finalRank, JSON.stringify(rewardPayload)],
    client
  );

  return mapSeasonReward(result.rows[0]);
}

/**
 * Claim season reward
 */
export async function claimSeasonReward(
  userId: string,
  seasonId: string,
  rewardType: string,
  client?: PoolClient
): Promise<SeasonRewardRecord | null> {
  const result = await runQuery<SeasonRewardRow>(
    `UPDATE season_rewards
     SET claimed = TRUE, claimed_at = NOW()
     WHERE user_id = $1 AND season_id = $2 AND reward_type = $3 AND claimed = FALSE
     RETURNING *`,
    [userId, seasonId, rewardType],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapSeasonReward(result.rows[0]);
}

// =============================================================================
// SEASON EVENTS
// =============================================================================

/**
 * Get season event participation
 */
export async function getSeasonEvent(
  userId: string,
  seasonId: string,
  eventId: string,
  client?: PoolClient
): Promise<SeasonEventRecord | null> {
  const result = await runQuery<SeasonEventRow>(
    `SELECT * FROM season_events WHERE user_id = $1 AND season_id = $2 AND event_id = $3`,
    [userId, seasonId, eventId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapSeasonEvent(result.rows[0]);
}

/**
 * Mark season event as participated
 */
export async function markSeasonEventParticipated(
  userId: string,
  seasonId: string,
  eventId: string,
  client?: PoolClient
): Promise<SeasonEventRecord> {
  const result = await runQuery<SeasonEventRow>(
    `INSERT INTO season_events (user_id, season_id, event_id, participated, reward_claimed)
     VALUES ($1, $2, $3, TRUE, FALSE)
     ON CONFLICT (user_id, season_id, event_id)
     DO UPDATE SET participated = TRUE
     RETURNING *`,
    [userId, seasonId, eventId],
    client
  );

  return mapSeasonEvent(result.rows[0]);
}

/**
 * Claim season event reward
 */
export async function claimSeasonEventReward(
  userId: string,
  seasonId: string,
  eventId: string,
  client?: PoolClient
): Promise<SeasonEventRecord | null> {
  const result = await runQuery<SeasonEventRow>(
    `UPDATE season_events
     SET reward_claimed = TRUE
     WHERE user_id = $1 AND season_id = $2 AND event_id = $3 AND reward_claimed = FALSE
     RETURNING *`,
    [userId, seasonId, eventId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapSeasonEvent(result.rows[0]);
}
