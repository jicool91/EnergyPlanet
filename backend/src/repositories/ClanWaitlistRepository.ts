import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface ClanWaitlistRecord {
  id: string;
  userId: string | null;
  telegramId: number | null;
  username: string | null;
  handle: string;
  handleLower: string;
  interest: string;
  note: string | null;
  source: string | null;
  ipHash: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface ClanWaitlistRow {
  id: string;
  user_id: string | null;
  telegram_id: string | null;
  username: string | null;
  handle: string;
  handle_lower: string;
  interest: string;
  note: string | null;
  source: string | null;
  ip_hash: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ClanWaitlistRow): ClanWaitlistRecord {
  return {
    id: row.id,
    userId: row.user_id,
    telegramId: row.telegram_id ? Number(row.telegram_id) : null,
    username: row.username,
    handle: row.handle,
    handleLower: row.handle_lower,
    interest: row.interest,
    note: row.note,
    source: row.source,
    ipHash: row.ip_hash,
    metadata:
      typeof row.metadata === 'object' && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function upsertRequest(
  data: {
    userId?: string | null;
    telegramId?: number | null;
    username?: string | null;
    handle: string;
    interest: string;
    note?: string | null;
    ipHash?: string | null;
    source?: string | null;
    metadata?: Record<string, unknown>;
  },
  client?: PoolClient
): Promise<ClanWaitlistRecord> {
  const result = await runQuery<ClanWaitlistRow>(
    `INSERT INTO clan_waitlist_requests (user_id, telegram_id, username, handle, handle_lower, interest, note, ip_hash, source, metadata)
     VALUES ($1, $2, $3, $4, LOWER($4), $5, $6, $7, $8, $9::jsonb)
     ON CONFLICT (handle_lower)
     DO UPDATE SET
       interest = EXCLUDED.interest,
       note = EXCLUDED.note,
       user_id = COALESCE(EXCLUDED.user_id, clan_waitlist_requests.user_id),
       telegram_id = COALESCE(EXCLUDED.telegram_id, clan_waitlist_requests.telegram_id),
       username = COALESCE(EXCLUDED.username, clan_waitlist_requests.username),
       ip_hash = COALESCE(EXCLUDED.ip_hash, clan_waitlist_requests.ip_hash),
       source = COALESCE(EXCLUDED.source, clan_waitlist_requests.source),
       metadata = clan_waitlist_requests.metadata || EXCLUDED.metadata,
       updated_at = NOW()
     RETURNING *`,
    [
      data.userId ?? null,
      data.telegramId ?? null,
      data.username ?? null,
      data.handle,
      data.interest,
      data.note ?? null,
      data.ipHash ?? null,
      data.source ?? null,
      JSON.stringify(data.metadata ?? {}),
    ],
    client
  );

  return mapRow(result.rows[0]);
}

export async function findRecentByIpHash(
  ipHash: string,
  withinMinutes: number,
  client?: PoolClient
): Promise<ClanWaitlistRecord | null> {
  const result = await runQuery<ClanWaitlistRow>(
    `SELECT *
     FROM clan_waitlist_requests
     WHERE ip_hash = $1 AND created_at >= NOW() - ($2 || ' minutes')::interval
     ORDER BY created_at DESC
     LIMIT 1`,
    [ipHash, withinMinutes],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function listRequests(
  options: {
    limit?: number;
    cursor?: string | null;
  } = {},
  client?: PoolClient
): Promise<{ items: ClanWaitlistRecord[]; nextCursor: string | null }> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  let cursorClause = '';
  const params: Array<string | number> = [limit];

  if (options.cursor) {
    cursorClause = 'WHERE created_at < $2';
    params.push(new Date(options.cursor).toISOString());
  }

  const result = await runQuery<ClanWaitlistRow>(
    `SELECT *
     FROM clan_waitlist_requests
     ${cursorClause}
     ORDER BY created_at DESC
     LIMIT $1`,
    params,
    client
  );

  const items = result.rows.map(mapRow);
  const nextCursor = items.length === limit ? items[items.length - 1]?.createdAt.toISOString() ?? null : null;

  return { items, nextCursor };
}
