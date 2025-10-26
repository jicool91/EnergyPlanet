import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface PlayerSessionRecord {
  id: string;
  userId: string;
  authSessionId: string | null;
  lastTickAt: Date | null;
  pendingPassiveSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PlayerSessionRow {
  id: string;
  user_id: string;
  auth_session_id: string | null;
  last_tick_at: string | null;
  pending_passive_seconds: number;
  created_at: string;
  updated_at: string;
}

const mapPlayerSession = (row: PlayerSessionRow): PlayerSessionRecord => ({
  id: row.id,
  userId: row.user_id,
  authSessionId: row.auth_session_id,
  lastTickAt: row.last_tick_at ? new Date(row.last_tick_at) : null,
  pendingPassiveSeconds: row.pending_passive_seconds,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export async function findPlayerSessionByUserId(
  userId: string,
  client?: PoolClient
): Promise<PlayerSessionRecord | null> {
  const result = await runQuery<PlayerSessionRow>(
    `SELECT *
     FROM player_sessions
     WHERE user_id = $1`,
    [userId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapPlayerSession(result.rows[0]);
}

export async function ensurePlayerSession(
  userId: string,
  client?: PoolClient
): Promise<PlayerSessionRecord> {
  await runQuery(
    `INSERT INTO player_sessions (user_id)
     VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId],
    client
  );

  const session = await findPlayerSessionByUserId(userId, client);
  if (!session) {
    throw new Error(`Failed to ensure player session for user ${userId}`);
  }

  return session;
}

export interface UpdatePlayerSessionInput {
  authSessionId?: string | null;
  lastTickAt?: Date | null;
  pendingPassiveSeconds?: number;
}

export async function updatePlayerSession(
  userId: string,
  data: UpdatePlayerSessionInput,
  client?: PoolClient
): Promise<PlayerSessionRecord> {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.authSessionId !== undefined) {
    fields.push(`auth_session_id = $${fields.length + 1}`);
    values.push(data.authSessionId);
  }

  if (data.lastTickAt !== undefined) {
    fields.push(`last_tick_at = $${fields.length + 1}`);
    values.push(data.lastTickAt);
  }

  if (data.pendingPassiveSeconds !== undefined) {
    fields.push(`pending_passive_seconds = $${fields.length + 1}`);
    values.push(data.pendingPassiveSeconds);
  }

  if (fields.length === 0) {
    const current = await ensurePlayerSession(userId, client);
    return current;
  }

  values.push(userId);

  const result = await runQuery<PlayerSessionRow>(
    `UPDATE player_sessions
     SET ${fields.join(', ')}
     WHERE user_id = $${fields.length + 1}
     RETURNING *`,
    values,
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`Player session for user ${userId} not found`);
  }

  return mapPlayerSession(result.rows[0]);
}
