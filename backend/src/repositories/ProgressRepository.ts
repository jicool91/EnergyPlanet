import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface ProgressRecord {
  userId: string;
  level: number;
  xp: number;
  xpOverflow: number;
  energy: number;
  starsBalance: number;
  totalEnergyProduced: number;
  totalTaps: number;
  totalBuildingsPurchased: number;
  tapLevel: number;
  prestigeLevel: number;
  prestigeMultiplier: number;
  prestigeEnergySnapshot: number;
  prestigeLastReset: Date | null;
  prestigeProgress: number;
  achievementMultiplier: number;
  lastLogin: Date | null;
  lastLogout: Date | null;
  levelCapReachedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ProgressRow {
  user_id: string;
  level: number;
  xp: string;
  xp_overflow: string;
  energy: string;
  stars_balance: string;
  total_energy_produced: string;
  total_taps: string;
  total_buildings_purchased: string;
  tap_level: number;
  prestige_level: number;
  prestige_multiplier: string;
  prestige_energy_snapshot: string;
  prestige_last_reset: string | null;
  prestige_progress: number;
  achievement_multiplier: string;
  last_login: string | null;
  last_logout: string | null;
  level_cap_reached_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapProgress(row: ProgressRow): ProgressRecord {
  return {
    userId: row.user_id,
    level: row.level,
    xp: Number(row.xp),
    xpOverflow: Number(row.xp_overflow ?? '0'),
    energy: Number(row.energy),
    starsBalance: Number(row.stars_balance ?? '0'),
    totalEnergyProduced: Number(row.total_energy_produced),
    totalTaps: Number(row.total_taps ?? '0'),
    totalBuildingsPurchased: Number(row.total_buildings_purchased ?? '0'),
    tapLevel: row.tap_level,
    prestigeLevel: row.prestige_level ?? 0,
    prestigeMultiplier: Number(row.prestige_multiplier ?? '1'),
    prestigeEnergySnapshot: Number(row.prestige_energy_snapshot ?? '0'),
    prestigeLastReset: row.prestige_last_reset ? new Date(row.prestige_last_reset) : null,
    prestigeProgress: row.prestige_progress ?? 0,
    achievementMultiplier: Number(row.achievement_multiplier ?? '1'),
    lastLogin: row.last_login ? new Date(row.last_login) : null,
    lastLogout: row.last_logout ? new Date(row.last_logout) : null,
    levelCapReachedAt: row.level_cap_reached_at ? new Date(row.level_cap_reached_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function getProgress(
  userId: string,
  client?: PoolClient
): Promise<ProgressRecord | null> {
  const result = await runQuery<ProgressRow>(
    `SELECT *
     FROM progress
     WHERE user_id = $1`,
    [userId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapProgress(result.rows[0]);
}

export async function createDefaultProgress(
  userId: string,
  client?: PoolClient
): Promise<ProgressRecord> {
  const result = await runQuery<ProgressRow>(
    `INSERT INTO progress (user_id, level, xp, energy, stars_balance, total_energy_produced, tap_level, prestige_level, prestige_multiplier, prestige_energy_snapshot)
     VALUES ($1, 1, 0, 0, 0, 0, 1, 0, 1, 0)
     RETURNING *`,
    [userId],
    client
  );

  return mapProgress(result.rows[0]);
}

export interface UpdateProgressInput {
  level?: number;
  xp?: number;
  xpOverflow?: number;
  energy?: number;
  starsBalance?: number;
  totalEnergyProduced?: number;
  totalTaps?: number;
  totalBuildingsPurchased?: number;
  tapLevel?: number;
  prestigeLevel?: number;
  prestigeMultiplier?: number;
  prestigeEnergySnapshot?: number;
  prestigeLastReset?: Date | null;
  prestigeProgress?: number;
  achievementMultiplier?: number;
  lastLogin?: Date | null;
  lastLogout?: Date | null;
  levelCapReachedAt?: Date | null;
}

export async function updateProgress(
  userId: string,
  data: UpdateProgressInput,
  client?: PoolClient
): Promise<ProgressRecord> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.level !== undefined) {
    fields.push(`level = $${fields.length + 1}`);
    values.push(data.level);
  }

  if (data.xp !== undefined) {
    fields.push(`xp = $${fields.length + 1}`);
    values.push(data.xp);
  }

  if (data.xpOverflow !== undefined) {
    fields.push(`xp_overflow = $${fields.length + 1}`);
    values.push(data.xpOverflow);
  }

  if (data.energy !== undefined) {
    fields.push(`energy = $${fields.length + 1}`);
    values.push(data.energy);
  }

  if (data.starsBalance !== undefined) {
    fields.push(`stars_balance = $${fields.length + 1}`);
    values.push(data.starsBalance);
  }

  if (data.totalEnergyProduced !== undefined) {
    fields.push(`total_energy_produced = $${fields.length + 1}`);
    values.push(data.totalEnergyProduced);
  }

  if (data.totalTaps !== undefined) {
    fields.push(`total_taps = $${fields.length + 1}`);
    values.push(data.totalTaps);
  }

  if (data.totalBuildingsPurchased !== undefined) {
    fields.push(`total_buildings_purchased = $${fields.length + 1}`);
    values.push(data.totalBuildingsPurchased);
  }
  if (data.tapLevel !== undefined) {
    fields.push(`tap_level = $${fields.length + 1}`);
    values.push(data.tapLevel);
  }

  if (data.prestigeLevel !== undefined) {
    fields.push(`prestige_level = $${fields.length + 1}`);
    values.push(data.prestigeLevel);
  }

  if (data.prestigeMultiplier !== undefined) {
    fields.push(`prestige_multiplier = $${fields.length + 1}`);
    values.push(data.prestigeMultiplier);
  }

  if (data.prestigeEnergySnapshot !== undefined) {
    fields.push(`prestige_energy_snapshot = $${fields.length + 1}`);
    values.push(data.prestigeEnergySnapshot);
  }

  if (data.prestigeLastReset !== undefined) {
    fields.push(`prestige_last_reset = $${fields.length + 1}`);
    values.push(data.prestigeLastReset);
  }

  if (data.prestigeProgress !== undefined) {
    fields.push(`prestige_progress = $${fields.length + 1}`);
    values.push(data.prestigeProgress);
  }

  if (data.achievementMultiplier !== undefined) {
    fields.push(`achievement_multiplier = $${fields.length + 1}`);
    values.push(data.achievementMultiplier);
  }

  if (data.lastLogin !== undefined) {
    fields.push(`last_login = $${fields.length + 1}`);
    values.push(data.lastLogin);
  }

  if (data.lastLogout !== undefined) {
    fields.push(`last_logout = $${fields.length + 1}`);
    values.push(data.lastLogout);
  }

  if (data.levelCapReachedAt !== undefined) {
    fields.push(`level_cap_reached_at = $${fields.length + 1}`);
    values.push(data.levelCapReachedAt);
  }

  if (fields.length === 0) {
    const current = await getProgress(userId, client);
    if (!current) {
      throw new Error(`Progress for user ${userId} not found`);
    }
    return current;
  }

  values.push(userId);

  const result = await runQuery<ProgressRow>(
    `UPDATE progress
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE user_id = $${fields.length + 1}
     RETURNING *`,
    values,
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`Progress for user ${userId} not found`);
  }

  return mapProgress(result.rows[0]);
}

export async function adjustStarsBalance(
  userId: string,
  delta: number,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ stars_balance: string }>(
    `UPDATE progress
     SET stars_balance = stars_balance + $1
     WHERE user_id = $2
       AND stars_balance + $1 >= 0
     RETURNING stars_balance`,
    [delta, userId],
    client
  );

  if (result.rowCount === 0) {
    throw new Error(delta < 0 ? 'insufficient_stars' : `Progress for user ${userId} not found`);
  }

  return Number(result.rows[0].stars_balance);
}
