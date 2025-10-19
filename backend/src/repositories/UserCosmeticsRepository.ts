import { PoolClient } from 'pg';
import { runQuery } from './base';

interface UserCosmeticRow {
  id: string;
  user_id: string;
  cosmetic_id: string;
  acquired_at: string;
}

export interface UserCosmeticRecord {
  id: string;
  userId: string;
  cosmeticId: string;
  acquiredAt: Date;
}

function mapRow(row: UserCosmeticRow): UserCosmeticRecord {
  return {
    id: row.id,
    userId: row.user_id,
    cosmeticId: row.cosmetic_id,
    acquiredAt: new Date(row.acquired_at),
  };
}

export async function listUserCosmetics(
  userId: string,
  client?: PoolClient
): Promise<UserCosmeticRecord[]> {
  const result = await runQuery<UserCosmeticRow>(
    `SELECT *
     FROM user_cosmetics
     WHERE user_id = $1
     ORDER BY acquired_at ASC`,
    [userId],
    client
  );

  return result.rows.map(mapRow);
}

export async function addUserCosmetic(
  userId: string,
  cosmeticId: string,
  client?: PoolClient
): Promise<UserCosmeticRecord> {
  const result = await runQuery<UserCosmeticRow>(
    `INSERT INTO user_cosmetics (user_id, cosmetic_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, cosmetic_id)
     DO UPDATE SET acquired_at = COALESCE(user_cosmetics.acquired_at, NOW())
     RETURNING *`,
    [userId, cosmeticId],
    client
  );

  return mapRow(result.rows[0]);
}

export async function removeUserCosmetic(
  userId: string,
  cosmeticId: string,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `DELETE FROM user_cosmetics
     WHERE user_id = $1 AND cosmetic_id = $2`,
    [userId, cosmeticId],
    client
  );
}

export async function hasUserCosmetic(
  userId: string,
  cosmeticId: string,
  client?: PoolClient
): Promise<boolean> {
  const result = await runQuery<{ exists: boolean }>(
    `SELECT EXISTS (
        SELECT 1 FROM user_cosmetics
        WHERE user_id = $1 AND cosmetic_id = $2
     ) AS exists`,
    [userId, cosmeticId],
    client
  );

  return Boolean(result.rows[0]?.exists);
}
