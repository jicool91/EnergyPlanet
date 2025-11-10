import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
import { isAxiosError } from 'axios';
import { Panel, Surface, Button, Loader, ClanComingSoon } from '@/components';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { useChatStore, type ChatMessageState } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import type { GlobalChatAuthor } from '@/services/chat';
import { useNotification } from '@/hooks/useNotification';
import { logClientEvent } from '@/services/telemetry';

const POLL_INTERVAL_MS = 5000;
const NEW_MESSAGE_SCROLL_THRESHOLD = 64;
const MAX_CHAT_LENGTH = 500;

type ChatScope = 'global' | 'clan';

const CHAT_TABS: Array<{ id: ChatScope; label: string; emoji: string }> = [
  { id: 'global', label: 'Глобальный', emoji: '🌍' },
  { id: 'clan', label: 'Клановый', emoji: '🏰' },
];

export function ChatScreen() {
  const [scope, setScope] = useState<ChatScope>('global');

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="px-4">
        <Panel
          tone="overlay"
          border="subtle"
          elevation="soft"
          padding="sm"
          spacing="none"
          aria-label="Навигация по чатам"
          className="grid grid-cols-2 gap-xs"
        >
          {CHAT_TABS.map(tab => {
            const isActive = tab.id === scope;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setScope(tab.id)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'flex h-12 items-center justify-center rounded-2xl bg-state-accent-pill text-text-inverse font-semibold transition-colors'
                    : 'flex h-12 items-center justify-center rounded-2xl text-text-secondary font-semibold transition-colors hover:bg-layer-overlay-ghost-soft hover:text-text-primary'
                }
              >
                <span aria-hidden="true" className="mr-2 text-title">
                  {tab.emoji}
                </span>
                {tab.label}
              </button>
            );
          })}
        </Panel>
      </div>

      <div className="flex flex-1 min-h-0 px-4 pb-4">
        {scope === 'global' ? (
          <GlobalChatSection />
        ) : (
          <Surface
            tone="overlayStrong"
            border="subtle"
            elevation="soft"
            padding="lg"
            rounded="3xl"
            className="flex flex-1 items-center justify-center"
          >
            <ClanComingSoon />
          </Surface>
        )}
      </div>
    </div>
  );
}

function GlobalChatSection() {
  const authReady = useAuthStore(state => state.authReady);
  const { error: notifyError } = useNotification();
  const setBottomNavHidden = useUIStore(state => state.setBottomNavHidden);

  const { userId, username, level, profile, loadProfile } = useGameStore(
    useShallow(state => ({
      userId: state.userId,
      username: state.username,
      level: state.level,
      profile: state.profile,
      loadProfile: state.loadProfile,
    }))
  );

  const {
    messages,
    isLoading,
    isLoadingMore,
    isSending,
    hasMore,
    error,
    initialized,
    loadInitial,
    loadOlder,
    pollNew,
    sendMessage,
  } = useChatStore(
    useShallow(state => ({
      messages: state.messages,
      isLoading: state.isLoading,
      isLoadingMore: state.isLoadingMore,
      isSending: state.isSending,
      hasMore: state.hasMore,
      error: state.error,
      initialized: state.initialized,
      loadInitial: state.loadInitial,
      loadOlder: state.loadOlder,
      pollNew: state.pollNew,
      sendMessage: state.sendMessage,
    }))
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [queuedNewCount, setQueuedNewCount] = useState(0);
  const prevLengthRef = useRef(0);
  const prependAnchorRef = useRef<{ height: number; scrollTop: number } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isComposerFocused, setIsComposerFocused] = useState(false);

  const viewerAuthor: GlobalChatAuthor | null = useMemo(() => {
    if (!userId) {
      return null;
    }

    return {
      user_id: userId,
      telegram_id: profile?.user.telegram_id ?? 0,
      username: profile?.user.username ?? username ?? null,
      first_name: profile?.user.first_name ?? null,
      last_name: profile?.user.last_name ?? null,
      level: profile?.progress.level ?? level ?? 1,
      equipped_avatar_frame: profile?.profile.equipped_avatar_frame ?? null,
    };
  }, [level, profile, userId, username]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  const scrollToBottomAndReset = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      scrollToBottom(behavior);
      isAtBottomRef.current = true;
      setIsAtBottom(true);
      setQueuedNewCount(0);
    },
    [scrollToBottom]
  );

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    loadInitial().catch(reason => {
      console.warn('Failed to load global chat', reason);
    });
  }, [authReady, userId, loadInitial]);

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    if (!profile || profile.user.id !== userId) {
      loadProfile().catch(reason => {
        console.warn('Failed to load profile for chat composer', reason);
      });
    }
  }, [authReady, userId, profile, loadProfile]);

  useEffect(() => {
    setBottomNavHidden(isComposerFocused);
    return () => {
      setBottomNavHidden(false);
    };
  }, [isComposerFocused, setBottomNavHidden]);

  useEffect(() => {
    if (!authReady || !userId) {
      return;
    }

    const timer = window.setInterval(() => {
      void pollNew().then(newCount => {
        if (newCount > 0) {
          if (isAtBottomRef.current) {
            scrollToBottomAndReset('smooth');
          } else {
            setQueuedNewCount(count => count + newCount);
          }
        }
      });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [authReady, userId, pollNew, scrollToBottomAndReset]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !prependAnchorRef.current || isLoadingMore) {
      return;
    }

    const { height, scrollTop } = prependAnchorRef.current;
    const diff = container.scrollHeight - height;
    container.scrollTop = scrollTop + diff;
    prependAnchorRef.current = null;
  }, [isLoadingMore]);

  useEffect(() => {
    const currentLength = messages.length;
    const prevLength = prevLengthRef.current;

    if (currentLength === prevLength) {
      return;
    }

    prevLengthRef.current = currentLength;

    if (prependAnchorRef.current) {
      return;
    }

    if (currentLength > 0 && isAtBottomRef.current) {
      scrollToBottom(prevLength === 0 ? 'auto' : 'smooth');
    }
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const atBottom = distanceFromBottom <= NEW_MESSAGE_SCROLL_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
    if (atBottom) {
      setQueuedNewCount(0);
    }
  }, []);

  const handleLoadOlder = useCallback(() => {
    if (!hasMore || isLoadingMore) {
      return;
    }
    const container = scrollRef.current;
    if (container) {
      prependAnchorRef.current = {
        height: container.scrollHeight,
        scrollTop: container.scrollTop,
      };
    }
    loadOlder().catch(reason => {
      console.warn('Failed to load older chat messages', reason);
    });
  }, [hasMore, isLoadingMore, loadOlder]);

  const handleSend = useCallback(() => {
    if (!viewerAuthor) {
      notifyError('Авторизуйтесь, чтобы писать в чат');
      return;
    }

    const text = inputValue.trim();
    if (!text) {
      return;
    }

    const clientMessageId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    logClientEvent('chat_message_send_attempt', {
      length: text.length,
    });

    void sendMessage({ text, author: viewerAuthor, clientMessageId })
      .then(() => {
        setInputValue('');
        scrollToBottomAndReset('smooth');
        logClientEvent('chat_message_send_success', {
          length: text.length,
        });
      })
      .catch(error => {
        const errorCode = isAxiosError(error)
          ? (error.response?.data as { error?: string })?.error
          : undefined;
        const friendly = mapChatErrorCode(errorCode);
        notifyError(friendly);
        logClientEvent('chat_message_send_error', {
          code: errorCode ?? 'unknown',
        });
      });
  }, [inputValue, notifyError, sendMessage, viewerAuthor, scrollToBottomAndReset]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!authReady || !userId) {
    return (
      <Surface
        tone="overlayStrong"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-1 items-center justify-center"
      >
        <p className="text-center text-body text-text-secondary">
          Загружаем профиль… откройте Energy Planet через Telegram, чтобы писать в чат.
        </p>
      </Surface>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col gap-3">
      {error ? (
        <Surface tone="overlay" border="accent" elevation="soft" rounded="3xl" padding="md">
          <p className="text-body text-text-primary">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => {
              loadInitial(true).catch(reason => {
                console.warn('Retry chat load failed', reason);
              });
            }}
          >
            Повторить загрузку
          </Button>
        </Surface>
      ) : null}

      <Surface
        tone="primary"
        border="subtle"
        elevation="soft"
        padding="none"
        rounded="3xl"
        className="flex flex-1 min-h-0 flex-col overflow-hidden"
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto px-4 py-4"
        >
          {isLoading && !initialized ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-text-secondary">
              <Loader label="Загружаем сообщения" />
              <p className="text-body text-text-secondary">Соединяемся с командным центром…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-text-secondary">
              <span className="text-display" role="img" aria-label="Space satellite">
                🛰️
              </span>
              <p className="text-body text-text-secondary">
                Будьте первым, кто пришлёт сообщение в глобальный чат!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {hasMore && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={isLoadingMore}
                    onClick={handleLoadOlder}
                  >
                    Показать предыдущие
                  </Button>
                </div>
              )}
              <ul className="flex flex-col gap-3">
                {messages.map(message => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.author.user_id === userId}
                  />
                ))}
              </ul>
            </div>
          )}

          {queuedNewCount > 0 && !isAtBottom && (
            <div className="pointer-events-none absolute bottom-6 left-0 flex w-full justify-center">
              <Button
                variant="primary"
                size="sm"
                className="pointer-events-auto"
                onClick={() => {
                  setQueuedNewCount(0);
                  scrollToBottomAndReset('smooth');
                }}
              >
                {queuedNewCount > 1
                  ? `Показать ${queuedNewCount} новых`
                  : 'Показать новое сообщение'}
              </Button>
            </div>
          )}
        </div>

        <div className="border-t border-border-layer bg-layer-overlay-soft px-4 py-3">
          <div className="flex items-end gap-3">
            <textarea
              value={inputValue}
              maxLength={MAX_CHAT_LENGTH}
              onChange={event => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsComposerFocused(true)}
              onBlur={() => setIsComposerFocused(false)}
              placeholder="Напишите что-нибудь…"
              className="min-h-[56px] flex-1 resize-none rounded-2xl border border-border-layer bg-transparent px-4 py-3 text-body text-text-primary placeholder:text-text-secondary focus:border-accent-gold focus:outline-none"
            />
            <Button
              variant="primary"
              size="md"
              loading={isSending}
              disabled={!inputValue.trim()}
              onClick={handleSend}
            >
              Отправить
            </Button>
          </div>
        </div>
      </Surface>
    </div>
  );
}

function MessageBubble({ message, isOwn }: { message: ChatMessageState; isOwn: boolean }) {
  const createdAt = useMemo(() => new Date(message.created_at), [message.created_at]);
  const timeLabel = useMemo(
    () =>
      createdAt.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    [createdAt]
  );

  const displayName = useMemo(() => formatDisplayName(message.author), [message.author]);

  return (
    <li className={clsx('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
      <div className="flex items-baseline gap-2 text-caption text-text-secondary">
        <span className="font-semibold text-text-primary">{displayName}</span>
        <span className="text-text-secondary/80">Lvl {message.author.level}</span>
        <span>{timeLabel}</span>
      </div>
      <div
        className={clsx(
          'max-w-[90%] rounded-2xl px-4 py-3 text-body shadow-elevation-1 transition-colors',
          isOwn
            ? 'bg-accent-gold/90 text-black'
            : 'border border-white/10 bg-white/10 text-white backdrop-blur-sm'
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        {message.optimistic && (
          <span className="mt-1 block text-caption text-text-secondary">Отправка…</span>
        )}
      </div>
    </li>
  );
}

function formatDisplayName(author: GlobalChatAuthor) {
  if (author.username) {
    return `@${author.username}`;
  }
  const fullName = [author.first_name, author.last_name].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }
  if (author.telegram_id) {
    return `Игрок #${author.telegram_id}`;
  }
  return 'Игрок';
}

function mapChatErrorCode(code?: string): string {
  switch (code) {
    case 'chat_rate_limited':
      return 'Можно отправлять лишь несколько сообщений подряд. Попробуйте через пару секунд.';
    case 'chat_disabled':
      return 'Чат временно отключён администрацией.';
    case 'message_required':
      return 'Нужно ввести текст сообщения.';
    case 'message_too_long':
      return 'Сообщение слишком длинное — сократите его до 500 символов.';
    default:
      return 'Не удалось отправить сообщение. Проверьте соединение и попробуйте снова.';
  }
}
