import { PoolClient } from 'pg';
import { runQuery } from './base';
import { recordRefreshAuditMetric } from '../metrics/auth';

export interface SessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  version: number;
  lastUsedAt: Date | null;
  lastIp: string | null;
  lastUserAgent: string | null;
  revokedAt: Date | null;
  familyId: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  refresh_token: string;
  expires_at: string;
  created_at: string;
  version: number;
  last_used_at: string | null;
  last_ip: string | null;
  last_user_agent: string | null;
  revoked_at: string | null;
  family_id: string;
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    refreshTokenHash: row.refresh_token,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    version: row.version,
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    lastIp: row.last_ip,
    lastUserAgent: row.last_user_agent,
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
    familyId: row.family_id,
  };
}

export interface CreateSessionOptions {
  familyId?: string;
  ip?: string | null;
  userAgent?: string | null;
}

export async function createSession(
  userId: string,
  refreshTokenHash: string,
  expiresAt: Date,
  options: CreateSessionOptions = {},
  client?: PoolClient
): Promise<SessionRecord> {
  const result = await runQuery<SessionRow>(
    `INSERT INTO sessions (
        user_id,
        refresh_token,
        expires_at,
        family_id,
        version,
        last_used_at,
        last_ip,
        last_user_agent
     )
     VALUES ($1, $2, $3, COALESCE($4, uuid_generate_v4()), 1, NOW(), $5, $6)
     RETURNING *`,
    [
      userId,
      refreshTokenHash,
      expiresAt.toISOString(),
      options.familyId ?? null,
      options.ip ?? null,
      options.userAgent ?? null,
    ],
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

export async function findSessionById(id: string, client?: PoolClient): Promise<SessionRecord | null> {
  const result = await runQuery<SessionRow>(
    `SELECT *
     FROM sessions
     WHERE id = $1`,
    [id],
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

export async function rotateSessionToken(
  id: string,
  refreshTokenHash: string,
  expiresAt: Date,
  options: { ip?: string | null; userAgent?: string | null } = {},
  client?: PoolClient
): Promise<SessionRecord> {
  const result = await runQuery<SessionRow>(
    `UPDATE sessions
     SET refresh_token = $1,
         expires_at = $2,
         version = version + 1,
         last_used_at = NOW(),
         last_ip = $4,
         last_user_agent = $5
     WHERE id = $3
     RETURNING *`,
    [refreshTokenHash, expiresAt.toISOString(), id, options.ip ?? null, options.userAgent ?? null],
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`Session ${id} not found`);
  }

  return mapSession(result.rows[0]);
}

export async function markSessionRevoked(
  id: string,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE id = $1`,
    [id],
    client
  );
}

export async function updateSessionUsage(
  id: string,
  ip: string | null,
  userAgent: string | null,
  client?: PoolClient
): Promise<SessionRecord> {
  const result = await runQuery<SessionRow>(
    `UPDATE sessions
     SET last_used_at = NOW(),
         last_ip = $2,
         last_user_agent = $3
     WHERE id = $1
     RETURNING *`,
    [id, ip, userAgent],
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`Session ${id} not found`);
  }

  return mapSession(result.rows[0]);
}

export async function insertRefreshAuditEntry(
  data: {
    sessionId: string | null;
    userId: string | null;
    familyId: string | null;
    hashedToken: string;
    reason: string;
    ip?: string | null;
    userAgent?: string | null;
    revocationReason?: string | null;
  },
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `INSERT INTO session_refresh_audit (
       session_id,
       user_id,
       family_id,
       hashed_token,
       reason,
       ip,
       user_agent,
       revocation_reason
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      data.sessionId,
      data.userId,
      data.familyId,
      data.hashedToken,
      data.reason,
      data.ip ?? null,
      data.userAgent ?? null,
      data.revocationReason ?? null,
    ],
    client
  );

  recordRefreshAuditMetric(data.reason, data.revocationReason ?? null);
}

export interface SessionFamilySummary {
  familyId: string;
  userId: string;
  activeSessions: number;
  totalSessions: number;
  lastUsedAt: Date | null;
  lastIp: string | null;
  lastUserAgent: string | null;
}

export async function listSessionFamilies(
  options: { userId?: string | null; limit?: number; offset?: number },
  client?: PoolClient
): Promise<SessionFamilySummary[]> {
  const result = await runQuery<{
    family_id: string;
    user_id: string;
    active_sessions: number;
    total_sessions: number;
    last_used_at: string | null;
    last_ip: string | null;
    last_user_agent: string | null;
  }>(
    `SELECT
        family_id,
        user_id,
        COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active_sessions,
        COUNT(*) AS total_sessions,
        MAX(last_used_at) AS last_used_at,
        MAX(last_ip) FILTER (WHERE last_ip IS NOT NULL) AS last_ip,
        MAX(last_user_agent) FILTER (WHERE last_user_agent IS NOT NULL) AS last_user_agent
     FROM sessions
     WHERE ($1::uuid IS NULL OR user_id = $1::uuid)
     GROUP BY family_id, user_id
     ORDER BY MAX(last_used_at) DESC NULLS LAST, family_id
     LIMIT $2 OFFSET $3`,
    [options.userId ?? null, options.limit ?? 50, options.offset ?? 0],
    client
  );

  return result.rows.map(row => ({
    familyId: row.family_id,
    userId: row.user_id,
    activeSessions: Number(row.active_sessions),
    totalSessions: Number(row.total_sessions),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    lastIp: row.last_ip,
    lastUserAgent: row.last_user_agent,
  }));
}

export async function getSessionFamilySummary(
  familyId: string,
  client?: PoolClient
): Promise<SessionFamilySummary | null> {
  const result = await runQuery<{
    family_id: string;
    user_id: string;
    active_sessions: number;
    total_sessions: number;
    last_used_at: string | null;
    last_ip: string | null;
    last_user_agent: string | null;
  }>(
    `SELECT
        family_id,
        user_id,
        COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active_sessions,
        COUNT(*) AS total_sessions,
        MAX(last_used_at) AS last_used_at,
        MAX(last_ip) FILTER (WHERE last_ip IS NOT NULL) AS last_ip,
        MAX(last_user_agent) FILTER (WHERE last_user_agent IS NOT NULL) AS last_user_agent
     FROM sessions
     WHERE family_id = $1
     GROUP BY family_id, user_id`,
    [familyId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    familyId: row.family_id,
    userId: row.user_id,
    activeSessions: Number(row.active_sessions),
    totalSessions: Number(row.total_sessions),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
    lastIp: row.last_ip,
    lastUserAgent: row.last_user_agent,
  };
}

export async function markSessionFamilyRevoked(
  familyId: string,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE family_id = $1
       AND revoked_at IS NULL`,
    [familyId],
    client
  );

  return result.rowCount ?? 0;
}

export async function markSessionsRevokedForUser(
  userId: string,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE user_id = $1
       AND revoked_at IS NULL`,
    [userId],
    client
  );

  return result.rowCount ?? 0;
}

export async function pruneSessionRefreshAuditOlderThan(
  retentionDays: number,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery(
    `DELETE FROM session_refresh_audit
     WHERE created_at < NOW() - make_interval(days => $1::int)`,
    [Math.max(Math.floor(retentionDays), 1)],
    client
  );

  return result.rowCount ?? 0;
}
