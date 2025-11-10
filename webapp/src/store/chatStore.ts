import { create } from 'zustand';
import {
  fetchGlobalChatMessages,
  sendGlobalChatMessage,
  type GlobalChatMessage,
  type GlobalChatAuthor,
} from '@/services/chat';
import { describeError } from './storeUtils';

export interface ChatMessageState extends GlobalChatMessage {
  optimistic?: boolean;
}

interface ChatState {
  messages: ChatMessageState[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isPolling: boolean;
  isSending: boolean;
  error: string | null;
  hasMore: boolean;
  nextCursor: string | null;
  latestCursor: string | null;
  initialized: boolean;
  loadInitial: (force?: boolean) => Promise<void>;
  loadOlder: () => Promise<void>;
  pollNew: () => Promise<number>;
  sendMessage: (params: {
    text: string;
    author: GlobalChatAuthor;
    clientMessageId: string;
  }) => Promise<void>;
  reset: () => void;
}

const initialState: Omit<
  ChatState,
  'loadInitial' | 'loadOlder' | 'pollNew' | 'sendMessage' | 'reset'
> = {
  messages: [],
  isLoading: false,
  isLoadingMore: false,
  isPolling: false,
  isSending: false,
  error: null,
  hasMore: true,
  nextCursor: null,
  latestCursor: null,
  initialized: false,
};

const sortAndDedupe = (messages: ChatMessageState[]): ChatMessageState[] => {
  const map = new Map<string, ChatMessageState>();
  for (const message of messages) {
    map.set(message.id, message);
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  loadInitial: async (force = false) => {
    const { initialized, isLoading } = get();
    if (initialized && !force) {
      return;
    }
    if (isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await fetchGlobalChatMessages({ limit: 50 });
      set({
        messages: sortAndDedupe(response.messages),
        isLoading: false,
        initialized: true,
        hasMore: response.meta.has_more,
        nextCursor: response.meta.next_cursor,
        latestCursor: response.meta.newest_cursor ?? get().latestCursor,
        error: null,
      });
    } catch (error) {
      const { message } = describeError(error, 'Не удалось загрузить чат');
      set({
        error: message,
        isLoading: false,
        initialized: false,
      });
      throw error;
    }
  },

  loadOlder: async () => {
    const { nextCursor, isLoadingMore, hasMore } = get();
    if (!nextCursor || !hasMore || isLoadingMore) {
      if (!nextCursor) {
        set({ hasMore: false });
      }
      return;
    }

    set({ isLoadingMore: true });

    try {
      const response = await fetchGlobalChatMessages({ cursor: nextCursor, limit: 50 });
      set(state => ({
        messages: sortAndDedupe([...response.messages, ...state.messages]),
        isLoadingMore: false,
        hasMore: response.meta.has_more,
        nextCursor: response.meta.next_cursor,
      }));
    } catch (error) {
      set({ isLoadingMore: false });
      throw error;
    }
  },

  pollNew: async () => {
    const { latestCursor, isPolling } = get();
    if (!latestCursor || isPolling) {
      return 0;
    }

    set({ isPolling: true });

    try {
      const response = await fetchGlobalChatMessages({ since: latestCursor });
      const newCount = response.messages.length;
      if (newCount === 0) {
        set({ isPolling: false });
        return 0;
      }

      set(state => ({
        messages: sortAndDedupe([...state.messages, ...response.messages]),
        latestCursor: response.meta.newest_cursor ?? state.latestCursor,
        isPolling: false,
      }));

      return newCount;
    } catch {
      set({ isPolling: false });
      return 0;
    }
  },

  sendMessage: async ({ text, author, clientMessageId }) => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Введите сообщение');
    }

    const optimisticMessage: ChatMessageState = {
      id: `optimistic-${clientMessageId}`,
      message: trimmed,
      created_at: new Date().toISOString(),
      client_message_id: clientMessageId,
      author,
      optimistic: true,
    };

    set(state => ({
      messages: sortAndDedupe([...state.messages, optimisticMessage]),
      isSending: true,
      error: null,
    }));

    try {
      const response = await sendGlobalChatMessage({
        message: trimmed,
        client_message_id: clientMessageId,
      });

      set(state => {
        const withoutOptimistic = state.messages.filter(
          message => !(message.optimistic && message.client_message_id === clientMessageId)
        );

        return {
          messages: sortAndDedupe([...withoutOptimistic, response.message]),
          isSending: false,
          latestCursor: response.meta.cursor,
        };
      });
    } catch (error) {
      set(state => ({
        messages: state.messages.filter(
          message => !(message.optimistic && message.client_message_id === clientMessageId)
        ),
        isSending: false,
      }));
      throw error;
    }
  },

  reset: () => {
    set({ ...initialState });
  },
}));

export const chatStore = {
  get messages() {
    return useChatStore.getState().messages;
  },
  reset() {
    useChatStore.getState().reset();
  },
};
