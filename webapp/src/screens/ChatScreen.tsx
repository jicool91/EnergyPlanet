import { useMemo, useState } from 'react';
import { TabPageSurface, Panel, Text, Surface } from '@/components';

type ChatScope = 'global' | 'clan';

const CHAT_TABS: Array<{ id: ChatScope; label: string; emoji: string }> = [
  { id: 'global', label: 'Глобальный', emoji: '🌍' },
  { id: 'clan', label: 'Клановый', emoji: '🏰' },
];

export function ChatScreen() {
  const [scope, setScope] = useState<ChatScope>('global');

  const activeTabLabel = useMemo(
    () => CHAT_TABS.find(tab => tab.id === scope)?.label ?? '',
    [scope]
  );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1 px-4">
        <Text variant="title" weight="semibold">
          Чаты
        </Text>
        <Text variant="body" tone="secondary">
          Общайтесь с игроками, а позже — с участниками клана. Вкладка появляется в ожидании
          полноценного чата.
        </Text>
      </header>

      <TabPageSurface>
        <Panel
          tone="overlay"
          border="subtle"
          elevation="soft"
          padding="xs"
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

        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col items-center gap-4 text-center"
          aria-live="polite"
          aria-label={`Секция ${activeTabLabel}`}
        >
          <Text variant="title" weight="semibold">
            Скоро здесь появится чат
          </Text>
          <Text variant="body" tone="secondary">
            Мы готовим обмен сообщениями, реакции и поддержку клановых каналов. Пока вы можете
            обсуждать стратегии в Telegram-группе проекта.
          </Text>
        </Surface>
      </TabPageSurface>
    </div>
  );
}
