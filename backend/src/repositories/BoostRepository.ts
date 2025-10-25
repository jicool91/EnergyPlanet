import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface BoostRecord {
  id: string;
  userId: string;
  boostType: string;
  multiplier: number;
  expiresAt: Date;
  createdAt: Date;
}

interface BoostRow {
  id: string;
  user_id: string;
  boost_type: string;
  multiplier: string;
  expires_at: string;
  created_at: string;
}

function mapBoost(row: BoostRow): BoostRecord {
  return {
    id: row.id,
    userId: row.user_id,
    boostType: row.boost_type,
    multiplier: Number(row.multiplier),
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

export async function getActiveBoosts(
  userId: string,
  client?: PoolClient
): Promise<BoostRecord[]> {
  const result = await runQuery<BoostRow>(
    `SELECT *
     FROM boosts
     WHERE user_id = $1
       AND expires_at > NOW()
     ORDER BY expires_at ASC`,
    [userId],
    client
  );

  return result.rows.map(mapBoost);
}

export async function findActiveBoostByType(
  userId: string,
  boostType: string,
  client?: PoolClient
): Promise<BoostRecord | null> {
  const result = await runQuery<BoostRow>(
    `SELECT *
     FROM boosts
     WHERE user_id = $1
       AND boost_type = $2
       AND expires_at > NOW()
     ORDER BY expires_at DESC
     LIMIT 1`,
    [userId, boostType],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapBoost(result.rows[0]);
}

export async function createBoost(
  userId: string,
  boostType: string,
  multiplier: number,
  expiresAt: Date,
  client?: PoolClient
): Promise<BoostRecord> {
  const result = await runQuery<BoostRow>(
    `INSERT INTO boosts (user_id, boost_type, multiplier, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, boostType, multiplier, expiresAt.toISOString()],
    client
  );

  return mapBoost(result.rows[0]);
}

export async function deleteBoostById(
  id: string,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `DELETE FROM boosts WHERE id = $1`,
    [id],
    client
  );
}

export async function clearBoostsForUser(
  userId: string,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `DELETE FROM boosts WHERE user_id = $1`,
    [userId],
    client
  );
}
