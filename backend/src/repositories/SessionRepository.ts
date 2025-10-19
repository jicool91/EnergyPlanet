import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

interface SessionRow {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    refreshTokenHash: row.refresh_token,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

export async function createSession(
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
  client?: PoolClient
): Promise<SessionRecord> {
  const result = await runQuery<SessionRow>(
    `INSERT INTO sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, refreshTokenHash, expiresAt.toISOString()],
    client
  );

  return mapSession(result.rows[0]);
}

export async function deleteSessionById(id: string, client?: PoolClient): Promise<void> {
  await runQuery(
    `DELETE FROM sessions
     WHERE id = $1`,
    [id],
    client
  );
}

export async function deleteSessionByHash(refreshTokenHash: string, client?: PoolClient): Promise<void> {
  await runQuery(
    `DELETE FROM sessions
     WHERE refresh_token = $1`,
    [refreshTokenHash],
    client
  );
}

export async function deleteSessionsForUser(userId: string, client?: PoolClient): Promise<void> {
  await runQuery(
    `DELETE FROM sessions
     WHERE user_id = $1`,
    [userId],
    client
  );
}

export async function findByRefreshTokenHash(
  refreshTokenHash: string,
  client?: PoolClient
): Promise<SessionRecord | null> {
  const result = await runQuery<SessionRow>(
    `SELECT *
     FROM sessions
     WHERE refresh_token = $1`,
    [refreshTokenHash],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapSession(result.rows[0]);
}

export async function pruneExpiredSessions(client?: PoolClient): Promise<number> {
  const result = await runQuery(
    `DELETE FROM sessions
     WHERE expires_at < NOW()`,
    [],
    client
  );

  return result.rowCount ?? 0;
}

export async function updateSessionExpiry(
  id: string,
  expiresAt: Date,
  client?: PoolClient
): Promise<SessionRecord> {
  const result = await runQuery<SessionRow>(
    `UPDATE sessions
     SET expires_at = $1
     WHERE id = $2
     RETURNING *`,
    [expiresAt.toISOString(), id],
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`Session ${id} not found`);
  }

  return mapSession(result.rows[0]);
}
