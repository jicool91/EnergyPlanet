import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface CreateUserInput {
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isAdmin?: boolean;
}

export interface UpdateUserInput {
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isBanned?: boolean;
  isAdmin?: boolean;
}

export interface UserRecord {
  id: string;
  telegramId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRow {
  id: string;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

function mapUser(row: UserRow): UserRecord {
  const telegramId =
    typeof row.telegram_id === 'string'
      ? parseInt(row.telegram_id, 10)
      : (row.telegram_id as unknown as number);

  return {
    id: row.id,
    telegramId,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    isAdmin: row.is_admin,
    isBanned: row.is_banned,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function findById(id: string, client?: PoolClient): Promise<UserRecord | null> {
  const result = await runQuery<UserRow>(
    `SELECT *
     FROM users
     WHERE id = $1`,
    [id],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function findByTelegramId(telegramId: number, client?: PoolClient): Promise<UserRecord | null> {
  const result = await runQuery<UserRow>(
    `SELECT *
     FROM users
     WHERE telegram_id = $1`,
    [telegramId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function createUser(data: CreateUserInput, client?: PoolClient): Promise<UserRecord> {
  const result = await runQuery<UserRow>(
    `INSERT INTO users
      (telegram_id, username, first_name, last_name, is_admin)
     VALUES ($1, $2, $3, $4, COALESCE($5, FALSE))
     RETURNING *`,
    [
      data.telegramId,
      data.username ?? null,
      data.firstName ?? null,
      data.lastName ?? null,
      data.isAdmin ?? false,
    ],
    client
  );

  return mapUser(result.rows[0]);
}

export async function updateUser(id: string, data: UpdateUserInput, client?: PoolClient): Promise<UserRecord> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.username !== undefined) {
    fields.push(`username = $${fields.length + 1}`);
    values.push(data.username);
  }

  if (data.firstName !== undefined) {
    fields.push(`first_name = $${fields.length + 1}`);
    values.push(data.firstName);
  }

  if (data.lastName !== undefined) {
    fields.push(`last_name = $${fields.length + 1}`);
    values.push(data.lastName);
  }

  if (data.isBanned !== undefined) {
    fields.push(`is_banned = $${fields.length + 1}`);
    values.push(data.isBanned);
  }

  if (data.isAdmin !== undefined) {
    fields.push(`is_admin = $${fields.length + 1}`);
    values.push(data.isAdmin);
  }

  if (fields.length === 0) {
    const existing = await findById(id, client);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }
    return existing;
  }

  values.push(id);

  const result = await runQuery<UserRow>(
    `UPDATE users
     SET ${fields.join(', ')}, updated_at = NOW()
     WHERE id = $${fields.length + 1}
     RETURNING *`,
    values,
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`User ${id} not found`);
  }

  return mapUser(result.rows[0]);
}
