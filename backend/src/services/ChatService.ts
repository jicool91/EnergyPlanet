import { config } from '../config';
import { contentService } from './ContentService';
import {
  fetchGlobalChatMessages,
  getGlobalChatMessageById,
  insertGlobalChatMessage,
  GlobalChatMessageRecord,
  GlobalChatCursor,
} from '../repositories/ChatRepository';
import { AppError } from '../middleware/errorHandler';
import { getRedis } from '../cache/redis';
import { logger } from '../utils/logger';
import { logEvent } from '../repositories/EventRepository';

interface ListGlobalChatOptions {
  limit?: number;
  cursor?: string;
  since?: string;
}

interface ChatAuthorDto {
  user_id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  level: number;
  equipped_avatar_frame: string | null;
}

export interface ChatMessageDto {
  id: string;
  message: string;
  created_at: string;
  client_message_id: string | null;
  author: ChatAuthorDto;
}

interface ChatListMeta {
  has_more: boolean;
  next_cursor: string | null;
  newest_cursor: string | null;
  requested_at: string;
  direction: 'initial' | 'older' | 'newer';
  poll_after_seconds: number;
}

export interface ChatListResponse {
  messages: ChatMessageDto[];
  meta: ChatListMeta;
}

export interface ChatSendResponse {
  message: ChatMessageDto;
  meta: {
    cursor: string;
  };
}

const CURSOR_SEPARATOR = '|';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const fallbackPollInterval = Math.max(config.chat.global.pollIntervalSeconds || 5, 3);
const MAX_SAFE_LIMIT = 100;
const MIN_SAFE_LIMIT = 10;

class ChatService {
  private ensureChatFeatureEnabled() {
    if (!contentService.isFeatureEnabled('chat_enabled')) {
      throw new AppError(403, 'chat_disabled');
    }
  }

  private normalizeLimit(limit?: number) {
    if (!limit || Number.isNaN(limit)) {
      return config.chat.global.pageSize || MIN_SAFE_LIMIT;
    }
    const sanitized = Math.floor(limit);
    return Math.max(1, Math.min(sanitized, MAX_SAFE_LIMIT));
  }

  private sanitizeMessage(raw: unknown): string {
    if (typeof raw !== 'string') {
      return '';
    }
    return raw.trim();
  }

  private validateClientMessageId(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const normalized = value.trim();
    if (!UUID_REGEX.test(normalized)) {
      throw new AppError(400, 'invalid_client_message_id');
    }
    return normalized.toLowerCase();
  }

  private encodeCursor(record: GlobalChatMessageRecord): string {
    const payload = `${record.createdAt.toISOString()}${CURSOR_SEPARATOR}${record.id}`;
    return Buffer.from(payload).toString('base64url');
  }

  private decodeCursor(cursor: string): GlobalChatCursor {
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      const [createdAt, id] = decoded.split(CURSOR_SEPARATOR);
      if (!createdAt || !id) {
        throw new Error('cursor_parts_missing');
      }
      const date = new Date(createdAt);
      if (Number.isNaN(date.getTime())) {
        throw new Error('cursor_invalid_date');
      }
      return { createdAt: date.toISOString(), id };
    } catch (error) {
      logger.warn(
        {
          cursor,
          error: error instanceof Error ? error.message : 'unknown',
        },
        'chat_cursor_decode_failed'
      );
      throw new AppError(400, 'invalid_cursor');
    }
  }

  private buildAuthor(record: GlobalChatMessageRecord): ChatAuthorDto {
    return {
      user_id: record.userId,
      telegram_id: record.telegramId,
      username: record.username,
      first_name: record.firstName,
      last_name: record.lastName,
      level: record.level,
      equipped_avatar_frame: record.equippedAvatarFrame,
    };
  }

  private mapRecord(record: GlobalChatMessageRecord): ChatMessageDto {
    return {
      id: record.id,
      message: record.message,
      created_at: record.createdAt.toISOString(),
      client_message_id: record.clientMessageId,
      author: this.buildAuthor(record),
    };
  }

  private async enforceRateLimit(userId: string): Promise<void> {
    const windowSec = Math.max(config.chat.global.rateLimitWindowSec || 0, 0);
    const maxMessages = Math.max(config.chat.global.rateLimitMaxMessages || 0, 0);

    if (!windowSec || !maxMessages) {
      return;
    }

    try {
      const client = getRedis();
      const key = `chat:global:rate:${userId}`;
      const current = await client.incr(key);

      if (current === 1) {
        await client.expire(key, windowSec);
      }

      if (current > maxMessages) {
        const ttl = await client.ttl(key);
        const retryAfter = ttl > 0 ? ttl : windowSec;
        throw new AppError(429, 'chat_rate_limited', true, { retry_after: retryAfter });
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.warn(
        {
          userId,
          error: error instanceof Error ? error.message : 'unknown',
        },
        'chat_rate_limit_fallback'
      );
    }
  }

  async listGlobalMessages(options: ListGlobalChatOptions): Promise<ChatListResponse> {
    this.ensureChatFeatureEnabled();

    if (options.cursor && options.since) {
      throw new AppError(400, 'invalid_cursor');
    }

    const limit = this.normalizeLimit(options.limit);
    const mode: 'initial' | 'older' | 'newer' = options.since
      ? 'newer'
      : options.cursor
        ? 'older'
        : 'initial';

    const cursor = options.cursor ? this.decodeCursor(options.cursor) : undefined;
    const sinceCursor = options.since ? this.decodeCursor(options.since) : undefined;

    const records = await fetchGlobalChatMessages({
      limit,
      direction: mode === 'newer' ? 'newer' : 'older',
      cursor: mode === 'newer' ? sinceCursor : cursor,
    });

    const requestedAt = new Date().toISOString();
    let messages: ChatMessageDto[] = [];

    if (mode === 'newer') {
      messages = records.map(r => this.mapRecord(r));
    } else {
      messages = [...records].reverse().map(r => this.mapRecord(r));
    }

    const hasMore = mode !== 'newer' && records.length === limit;
    const nextCursor = hasMore && records.length > 0 ? this.encodeCursor(records[records.length - 1]) : null;

    let newestCursor: string | null = null;
    if (mode === 'newer' && records.length > 0) {
      newestCursor = this.encodeCursor(records[records.length - 1]);
    } else if (mode === 'initial' && records.length > 0) {
      newestCursor = this.encodeCursor(records[0]);
    }

    return {
      messages,
      meta: {
        has_more: hasMore,
        next_cursor: nextCursor,
        newest_cursor: newestCursor,
        requested_at: requestedAt,
        direction: mode,
        poll_after_seconds: fallbackPollInterval,
      },
    };
  }

  async sendGlobalMessage(
    user: { id: string; telegramId: number; username?: string },
    payload: { message: unknown; clientMessageId?: string | null }
  ): Promise<ChatSendResponse> {
    this.ensureChatFeatureEnabled();

    const message = this.sanitizeMessage(payload.message);
    if (!message) {
      throw new AppError(400, 'message_required');
    }
    if (message.length > (config.chat.global.maxMessageLength || 500)) {
      throw new AppError(400, 'message_too_long');
    }

    const clientMessageId = this.validateClientMessageId(payload.clientMessageId);

    await this.enforceRateLimit(user.id);

    const recordId = await insertGlobalChatMessage(user.id, message, clientMessageId);
    const record = await getGlobalChatMessageById(recordId);

    if (!record) {
      throw new AppError(500, 'chat_message_lookup_failed');
    }

    await logEvent(user.id, 'global_chat_message', {
      length: message.length,
      has_username: Boolean(user.username),
      client_message_id: clientMessageId,
    });

    const dto = this.mapRecord(record);

    return {
      message: dto,
      meta: {
        cursor: this.encodeCursor(record),
      },
    };
  }
}

export const chatService = new ChatService();
