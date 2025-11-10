import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface GlobalChatMessageRecord {
  id: string;
  userId: string;
  message: string;
  clientMessageId: string | null;
  createdAt: Date;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  level: number;
  equippedAvatarFrame: string | null;
}

interface GlobalChatMessageRow {
  id: string;
  user_id: string;
  message: string;
  client_message_id: string | null;
  created_at: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  level: number | null;
  equipped_avatar_frame: string | null;
}

export type GlobalChatDirection = 'older' | 'newer';

export interface GlobalChatCursor {
  createdAt: string;
  id: string;
}

export interface FetchGlobalChatParams {
  limit: number;
  direction: GlobalChatDirection;
  cursor?: GlobalChatCursor;
}

const BASE_SELECT = `
  SELECT
    gcm.id,
    gcm.user_id,
    gcm.message,
    gcm.client_message_id,
    gcm.created_at,
    u.telegram_id,
    u.username,
    u.first_name,
    u.last_name,
    COALESCE(p.level, 1) AS level,
    prof.equipped_avatar_frame
  FROM global_chat_messages gcm
  JOIN users u ON gcm.user_id = u.id
  LEFT JOIN progress p ON p.user_id = gcm.user_id
  LEFT JOIN user_profile prof ON prof.user_id = gcm.user_id
  WHERE gcm.is_deleted = FALSE
`;

const mapRow = (row: GlobalChatMessageRow): GlobalChatMessageRecord => ({
  id: row.id,
  userId: row.user_id,
  message: row.message,
  clientMessageId: row.client_message_id,
  createdAt: new Date(row.created_at),
  telegramId: row.telegram_id,
  username: row.username,
  firstName: row.first_name,
  lastName: row.last_name,
  level: row.level ?? 1,
  equippedAvatarFrame: row.equipped_avatar_frame,
});

export async function insertGlobalChatMessage(
  userId: string,
  message: string,
  clientMessageId?: string | null,
  client?: PoolClient
): Promise<string> {
  const insertResult = await runQuery<{ id: string }>(
    `INSERT INTO global_chat_messages (user_id, message, client_message_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (client_message_id) DO NOTHING
     RETURNING id`,
    [userId, message, clientMessageId ?? null],
    client
  );

  if ((insertResult.rowCount ?? 0) > 0 && insertResult.rows.length > 0) {
    return insertResult.rows[0].id;
  }

  if (!clientMessageId) {
    throw new Error('Failed to insert chat message');
  }

  const existing = await runQuery<{ id: string }>(
    `SELECT id FROM global_chat_messages WHERE client_message_id = $1 LIMIT 1`,
    [clientMessageId],
    client
  );

  if ((existing.rowCount ?? 0) === 0 || existing.rows.length === 0) {
    throw new Error('Chat message idempotency lookup failed');
  }

  return existing.rows[0].id;
}

export async function fetchGlobalChatMessages(
  params: FetchGlobalChatParams,
  client?: PoolClient
): Promise<GlobalChatMessageRecord[]> {
  const values: unknown[] = [];
  const clauses: string[] = [];

  const pushValue = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (params.cursor) {
    const timestamp = pushValue(params.cursor.createdAt);
    const idValue = pushValue(params.cursor.id);
    const comparator = params.direction === 'newer' ? '>' : '<';
    clauses.push(`(gcm.created_at, gcm.id) ${comparator} (${timestamp}, ${idValue})`);
  }

  const limitPlaceholder = pushValue(params.limit);
  const whereClause = clauses.length ? `AND ${clauses.join(' AND ')}` : '';
  const orderClause =
    params.direction === 'newer'
      ? 'ORDER BY gcm.created_at ASC, gcm.id ASC'
      : 'ORDER BY gcm.created_at DESC, gcm.id DESC';

  const queryText = `
    ${BASE_SELECT}
    ${whereClause}
    ${orderClause}
    LIMIT ${limitPlaceholder}
  `;

  const result = await runQuery<GlobalChatMessageRow>(queryText, values, client);
  return result.rows.map(mapRow);
}

export async function getGlobalChatMessageById(
  id: string,
  client?: PoolClient
): Promise<GlobalChatMessageRecord | null> {
  const result = await runQuery<GlobalChatMessageRow>(
    `${BASE_SELECT} AND gcm.id = $1 LIMIT 1`,
    [id],
    client
  );

  if ((result.rowCount ?? 0) === 0 || result.rows.length === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}
