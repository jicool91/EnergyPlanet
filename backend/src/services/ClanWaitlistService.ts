import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { AppError } from '../middleware/errorHandler';
import {
  upsertRequest,
  findRecentByIpHash,
  listRequests,
  type ClanWaitlistRecord,
} from '../repositories/ClanWaitlistRepository';
import { logger } from '../utils/logger';

const INTEREST_WHITELIST = new Set(['raids', 'trading', 'wars']);
const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_LENGTH = 64;
const RATE_LIMIT_MINUTES = 60;

function hashIp(ip: string): string {
  const salt = process.env.WAITLIST_IP_SALT ?? 'energyplanet-waitlist';
  return crypto.createHash('sha256').update(`${ip}|${salt}`).digest('hex');
}

function normalizeHandle(input: string): string {
  let handle = input.trim();
  if (!handle.startsWith('@')) {
    handle = `@${handle}`;
  }
  return handle;
}

export class ClanWaitlistService {
  async submitRequest(
    payload: {
      userId?: string;
      telegramId?: number;
      username?: string | null;
      handle: string;
      interest: string;
      note?: string;
      ip?: string;
      source?: string;
    },
    client?: PoolClient
  ): Promise<ClanWaitlistRecord> {
    const handle = normalizeHandle(payload.handle);
    if (handle.length < MIN_HANDLE_LENGTH || handle.length > MAX_HANDLE_LENGTH) {
      throw new AppError(400, 'invalid_handle');
    }

    const interest = payload.interest.toLowerCase();
    if (!INTEREST_WHITELIST.has(interest)) {
      throw new AppError(400, 'invalid_interest');
    }

    const ipHash = payload.ip ? hashIp(payload.ip) : null;
    if (ipHash) {
      const recent = await findRecentByIpHash(ipHash, RATE_LIMIT_MINUTES, client);
      if (recent) {
        throw new AppError(429, 'too_many_requests');
      }
    }

    const record = await upsertRequest(
      {
        userId: payload.userId,
        telegramId: payload.telegramId,
        username: payload.username ?? null,
        handle,
        interest,
        note: payload.note?.trim() || null,
        ipHash,
        source: payload.source ?? 'webapp',
        metadata: {
          version: 'v1',
        },
      },
      client
    );

    logger.info({ handle: record.handle, interest }, 'clan_waitlist_request_saved');
    return record;
  }

  async listRequests(options: { limit?: number; cursor?: string | null } = {}) {
    return listRequests(options);
  }
}

export const clanWaitlistService = new ClanWaitlistService();
