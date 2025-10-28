import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface EventRecord {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  isSuspicious: boolean;
  createdAt: Date;
}

interface EventRow {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  is_suspicious: boolean;
  created_at: string;
}

function mapEvent(row: EventRow): EventRecord {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    eventData: row.event_data ?? {},
    isSuspicious: row.is_suspicious,
    createdAt: new Date(row.created_at),
  };
}

export async function logEvent(
  userId: string,
  eventType: string,
  eventData: Record<string, unknown>,
  options?: { suspicious?: boolean; client?: PoolClient }
): Promise<EventRecord> {
  const result = await runQuery<EventRow>(
    `INSERT INTO events (user_id, event_type, event_data, is_suspicious)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING *`,
    [userId, eventType, JSON.stringify(eventData ?? {}), options?.suspicious ?? false],
    options?.client
  );

  return mapEvent(result.rows[0]);
}

export async function getLastBoostClaim(
  userId: string,
  boostType: string,
  client?: PoolClient
): Promise<Date | null> {
  const result = await runQuery<{ created_at: string }>(
    `SELECT created_at
     FROM events
     WHERE user_id = $1
       AND event_type = 'boost_claim'
       AND event_data->>'boost_type' = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, boostType],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return new Date(result.rows[0].created_at);
}
