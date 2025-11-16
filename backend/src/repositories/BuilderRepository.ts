import { PoolClient } from 'pg';
import { runQuery } from './base';

export type BuilderStatus = 'active' | 'inactive' | 'expired';

export interface BuilderRecord {
  id: string;
  userId: string;
  slotIndex: number;
  status: BuilderStatus;
  unlockedAt: Date;
  expiresAt: Date | null;
  speedMultiplier: number;
  metadata: Record<string, unknown>;
}

interface BuilderRow {
  id: string;
  user_id: string;
  slot_index: number;
  status: BuilderStatus;
  unlocked_at: string;
  expires_at: string | null;
  speed_multiplier: string;
  metadata: Record<string, unknown>;
}

function mapBuilder(row: BuilderRow): BuilderRecord {
  return {
    id: row.id,
    userId: row.user_id,
    slotIndex: row.slot_index,
    status: row.status,
    unlockedAt: new Date(row.unlocked_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    speedMultiplier: Number(row.speed_multiplier),
    metadata: row.metadata ?? {},
  };
}

export async function listBuilders(userId: string, client?: PoolClient): Promise<BuilderRecord[]> {
  const result = await runQuery<BuilderRow>(
    `SELECT * FROM builders WHERE user_id = $1 ORDER BY slot_index ASC`,
    [userId],
    client
  );
  return result.rows.map(mapBuilder);
}

export async function ensureBaseBuilder(
  userId: string,
  client?: PoolClient
): Promise<BuilderRecord> {
  const result = await runQuery<BuilderRow>(
    `INSERT INTO builders (user_id, slot_index, status)
     VALUES ($1, 0, 'active')
     ON CONFLICT (user_id, slot_index) DO UPDATE
       SET status = 'active'
     RETURNING *`,
    [userId],
    client
  );
  return mapBuilder(result.rows[0]);
}

export interface UnlockBuilderInput {
  userId: string;
  slotIndex: number;
  status?: BuilderStatus;
  expiresAt?: Date | null;
  speedMultiplier?: number;
  metadata?: Record<string, unknown>;
}

export async function unlockBuilder(
  input: UnlockBuilderInput,
  client?: PoolClient
): Promise<BuilderRecord> {
  const result = await runQuery<BuilderRow>(
    `INSERT INTO builders (user_id, slot_index, status, expires_at, speed_multiplier, metadata)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id, slot_index) DO UPDATE
       SET status = EXCLUDED.status,
           expires_at = EXCLUDED.expires_at,
           speed_multiplier = EXCLUDED.speed_multiplier,
           metadata = EXCLUDED.metadata
     RETURNING *`,
    [
      input.userId,
      input.slotIndex,
      input.status ?? 'active',
      input.expiresAt ?? null,
      input.speedMultiplier ?? 1,
      input.metadata ?? {},
    ],
    client
  );
  return mapBuilder(result.rows[0]);
}

export async function updateBuilderStatus(
  userId: string,
  slotIndex: number,
  status: BuilderStatus,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `UPDATE builders SET status = $3 WHERE user_id = $1 AND slot_index = $2`,
    [userId, slotIndex, status],
    client
  );
}
