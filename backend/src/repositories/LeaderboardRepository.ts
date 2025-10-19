import { PoolClient } from 'pg';
import { runQuery } from './base';

interface LeaderboardRow {
  user_id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  level: number;
  total_energy_produced: string;
  row_number: string;
  equipped_avatar_frame: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  level: number;
  totalEnergyProduced: number;
  rank: number;
  equippedAvatarFrame: string | null;
}

function mapRow(row: LeaderboardRow): LeaderboardEntry {
  return {
    userId: row.user_id,
    telegramId: parseInt(row.telegram_id, 10),
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    level: row.level,
    totalEnergyProduced: Number(row.total_energy_produced),
    rank: Number(row.row_number),
    equippedAvatarFrame: row.equipped_avatar_frame,
  };
}

export async function fetchTopEntries(
  limit: number,
  offset: number,
  client?: PoolClient
): Promise<LeaderboardEntry[]> {
  const result = await runQuery<LeaderboardRow>(
    `
      WITH ranked AS (
        SELECT
          u.id AS user_id,
          u.telegram_id::text,
          u.username,
          u.first_name,
          u.last_name,
          p.level,
          p.total_energy_produced::text,
          ROW_NUMBER() OVER (
            ORDER BY p.total_energy_produced DESC, p.updated_at ASC
          ) AS row_number,
          prof.equipped_avatar_frame
        FROM progress p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN user_profile prof ON prof.user_id = u.id
      )
      SELECT *
      FROM ranked
      WHERE row_number > $2
      ORDER BY row_number
      LIMIT $1
    `,
    [limit, offset],
    client
  );

  return result.rows.map(mapRow);
}

export async function countPlayers(client?: PoolClient): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM progress`,
    [],
    client
  );
  return Number(result.rows[0]?.count ?? '0');
}

interface LeaderboardUserRow {
  row_number: string;
  user_id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  level: number;
  total_energy_produced: string;
  equipped_avatar_frame: string | null;
}

export async function fetchUserEntry(
  userId: string,
  client?: PoolClient
): Promise<LeaderboardEntry | null> {
  const result = await runQuery<LeaderboardUserRow>(
    `
      SELECT *
      FROM (
        SELECT
          u.id AS user_id,
          u.telegram_id::text,
          u.username,
          u.first_name,
          u.last_name,
          p.level,
          p.total_energy_produced::text,
          ROW_NUMBER() OVER (
            ORDER BY p.total_energy_produced DESC, p.updated_at ASC
          ) AS row_number,
          prof.equipped_avatar_frame
        FROM progress p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN user_profile prof ON prof.user_id = u.id
      ) ranked
      WHERE user_id = $1
    `,
    [userId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRow(result.rows[0] as LeaderboardRow);
}
