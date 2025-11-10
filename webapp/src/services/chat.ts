import { apiClient } from './apiClient';

export interface GlobalChatAuthor {
  user_id: string;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  level: number;
  equipped_avatar_frame: string | null;
}

export interface GlobalChatMessage {
  id: string;
  message: string;
  created_at: string;
  client_message_id: string | null;
  author: GlobalChatAuthor;
}

export interface GlobalChatMeta {
  has_more: boolean;
  next_cursor: string | null;
  newest_cursor: string | null;
  requested_at: string;
  direction: 'initial' | 'older' | 'newer';
  poll_after_seconds: number;
}

export interface GlobalChatResponse {
  messages: GlobalChatMessage[];
  meta: GlobalChatMeta;
}

export interface SendGlobalChatResponse {
  message: GlobalChatMessage;
  meta: {
    cursor: string;
  };
}

interface FetchParams {
  limit?: number;
  cursor?: string | null;
  since?: string | null;
  signal?: AbortSignal;
}

export async function fetchGlobalChatMessages(params?: FetchParams): Promise<GlobalChatResponse> {
  const response = await apiClient.get<GlobalChatResponse>('/chat/global/messages', {
    params: {
      ...(typeof params?.limit === 'number' ? { limit: params.limit } : {}),
      ...(params?.cursor ? { cursor: params.cursor } : {}),
      ...(params?.since ? { since: params.since } : {}),
    },
    signal: params?.signal,
  });

  return response.data;
}

export async function sendGlobalChatMessage(payload: {
  message: string;
  client_message_id?: string;
}): Promise<SendGlobalChatResponse> {
  const response = await apiClient.post<SendGlobalChatResponse>('/chat/global/messages', {
    message: payload.message,
    client_message_id: payload.client_message_id,
  });

  return response.data;
}
