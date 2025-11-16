import { PoolClient } from 'pg';
import { runQuery } from './base';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export interface FriendshipRecord {
  id: string;
  userOneId: string;
  userTwoId: string;
  initiatorId: string;
  status: FriendshipStatus;
  lastActionBy: string | null;
  lastActionAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface FriendshipRow {
  id: string;
  user_one_id: string;
  user_two_id: string;
  initiator_id: string;
  status: FriendshipStatus;
  last_action_by: string | null;
  last_action_at: string;
  created_at: string;
  updated_at: string;
}

interface FriendshipWithUserRow extends FriendshipRow {
  friend_id: string;
  friend_username: string | null;
  friend_first_name: string | null;
  friend_last_name: string | null;
  friend_telegram_id: string | null;
}

export interface FriendshipWithUser extends FriendshipRecord {
  friendUserId: string;
  friendUsername: string | null;
  friendFirstName: string | null;
  friendLastName: string | null;
  friendTelegramId: number | null;
}

function mapRow(row: FriendshipRow): FriendshipRecord {
  return {
    id: row.id,
    userOneId: row.user_one_id,
    userTwoId: row.user_two_id,
    initiatorId: row.initiator_id,
    status: row.status,
    lastActionBy: row.last_action_by,
    lastActionAt: new Date(row.last_action_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapWithUserRow(row: FriendshipWithUserRow): FriendshipWithUser {
  const base = mapRow(row);
  return {
    ...base,
    friendUserId: row.friend_id,
    friendUsername: row.friend_username,
    friendFirstName: row.friend_first_name,
    friendLastName: row.friend_last_name,
    friendTelegramId:
      typeof row.friend_telegram_id === 'string'
        ? Number(row.friend_telegram_id)
        : (row.friend_telegram_id as unknown as number) ?? null,
  };
}

export function normalizePair(userA: string, userB: string): {
  userOneId: string;
  userTwoId: string;
  swapped: boolean;
} {
  if (userA === userB) {
    throw new Error('user_ids_must_differ');
  }
  if (userA < userB) {
    return { userOneId: userA, userTwoId: userB, swapped: false };
  }
  return { userOneId: userB, userTwoId: userA, swapped: true };
}

export async function getFriendship(
  userA: string,
  userB: string,
  client?: PoolClient
): Promise<FriendshipRecord | null> {
  const { userOneId, userTwoId } = normalizePair(userA, userB);
  const result = await runQuery<FriendshipRow>(
    `SELECT *
     FROM friendships
     WHERE user_one_id = $1 AND user_two_id = $2
     LIMIT 1`,
    [userOneId, userTwoId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRow(result.rows[0]);
}

export async function createFriendship(
  input: {
    userOneId: string;
    userTwoId: string;
    initiatorId: string;
    status: FriendshipStatus;
  },
  client?: PoolClient
): Promise<FriendshipRecord> {
  const result = await runQuery<FriendshipRow>(
    `INSERT INTO friendships (user_one_id, user_two_id, initiator_id, status, last_action_by, last_action_at)
     VALUES ($1, $2, $3, $4, $3, NOW())
     RETURNING *`,
    [input.userOneId, input.userTwoId, input.initiatorId, input.status],
    client
  );

  return mapRow(result.rows[0]);
}

export async function updateFriendshipStatus(
  friendshipId: string,
  status: FriendshipStatus,
  actorId: string,
  client?: PoolClient
): Promise<FriendshipRecord> {
  const result = await runQuery<FriendshipRow>(
    `UPDATE friendships
     SET status = $1,
         last_action_by = $2,
         last_action_at = NOW(),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, actorId, friendshipId],
    client
  );

  if (result.rowCount === 0) {
    throw new Error('friendship_not_found');
  }

  return mapRow(result.rows[0]);
}

export async function deleteFriendship(
  friendshipId: string,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `DELETE FROM friendships WHERE id = $1`,
    [friendshipId],
    client
  );
}

export async function insertEvent(
  friendshipId: string,
  eventType: string,
  actorId: string | null,
  payload: Record<string, unknown>,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `INSERT INTO friendship_events (friendship_id, event_type, actor_id, payload)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [friendshipId, eventType, actorId, JSON.stringify(payload)],
    client
  );
}

export async function listFriendshipsForUser(
  userId: string,
  client?: PoolClient
): Promise<FriendshipWithUser[]> {
  const result = await runQuery<FriendshipWithUserRow>(
    `SELECT f.*, CASE WHEN f.user_one_id = $1 THEN f.user_two_id ELSE f.user_one_id END AS friend_id,
            u.username AS friend_username,
            u.first_name AS friend_first_name,
            u.last_name AS friend_last_name,
            u.telegram_id AS friend_telegram_id
     FROM friendships f
     JOIN users u ON u.id = CASE WHEN f.user_one_id = $1 THEN f.user_two_id ELSE f.user_one_id END
     WHERE f.user_one_id = $1 OR f.user_two_id = $1`,
    [userId],
    client
  );

  return result.rows.map(mapWithUserRow);
}

export async function countFriendshipsByStatus(
  userId: string,
  status: FriendshipStatus,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM friendships
     WHERE status = $1 AND (user_one_id = $2 OR user_two_id = $2)`,
    [status, userId],
    client
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function countOutgoingPending(
  userId: string,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM friendships
     WHERE status = 'pending' AND initiator_id = $1`,
    [userId],
    client
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function countOutgoingRequestsWithin(
  userId: string,
  minutes: number,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM friendships
     WHERE initiator_id = $1 AND created_at >= NOW() - ($2 || ' minutes')::interval`,
    [userId, minutes],
    client
  );

  return Number(result.rows[0]?.count ?? 0);
}
