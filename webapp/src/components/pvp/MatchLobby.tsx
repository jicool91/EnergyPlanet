import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Panel } from '@/components/Panel';
import { Button } from '@/components/Button';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { useNotification } from '@/hooks/useNotification';

export interface LobbyMode {
  id: string;
  name: string;
  description: string;
  icon?: string;
  recommended?: boolean;
  rewards: string[];
  queueEstimate?: string;
  queueSize?: number;
  mapName?: string;
  mapPreviewUrl?: string;
}

export interface MatchLobbyProps {
  modes: LobbyMode[];
  defaultModeId?: string;
  friendsOnline?: number;
  dailyBonus?: string;
  streakDays?: number;
  onSelectMode?: (modeId: string) => void;
  onJoinQueue?: (modeId: string) => void;
  onViewRewards?: (modeId: string) => void;
}

export function MatchLobby({
  modes,
  defaultModeId,
  friendsOnline = 0,
  dailyBonus,
  streakDays,
  onSelectMode,
  onJoinQueue,
  onViewRewards,
}: MatchLobbyProps) {
  const firstModeId = useMemo(() => {
    if (defaultModeId && modes.some(mode => mode.id === defaultModeId)) {
      return defaultModeId;
    }
    const recommended = modes.find(mode => mode.recommended);
    return recommended?.id ?? modes[0]?.id ?? '';
  }, [defaultModeId, modes]);

  const [activeModeId, setActiveModeId] = useState(firstModeId);
  const { success: notifySuccess, toast: notifyInfo } = useNotification();

  const activeMode = useMemo(
    () => modes.find(mode => mode.id === activeModeId) ?? modes[0],
    [modes, activeModeId]
  );

  const handleSelectMode = (modeId: string) => {
    setActiveModeId(modeId);
    onSelectMode?.(modeId);
    const mode = modes.find(m => m.id === modeId);
    if (mode) {
      notifyInfo(`Вы выбрали режим «${mode.name}»`, 2400, 'info');
    }
  };

  const handleJoinQueue = () => {
    if (!activeMode) {
      return;
    }
    onJoinQueue?.(activeMode.id);
    notifySuccess(
      `Вы в очереди режима «${activeMode.name}»${
        activeMode.queueEstimate ? ` · ${activeMode.queueEstimate}` : ''
      }`,
      3200
    );
  };

  const handleViewRewards = () => {
    if (!activeMode) {
      return;
    }
    onViewRewards?.(activeMode.id);
    notifyInfo(`Показываем награды режима «${activeMode.name}»`, 2600, 'star');
  };

  if (!activeMode) {
    return (
      <Panel tone="overlayStrong" className="text-center">
        <Text variant="body" tone="secondary">
          Режимы PvP временно недоступны.
        </Text>
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel tone="overlayStrong" spacing="md" padding="lg" className="gap-4">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Text variant="title" weight="semibold">
              PvP Match Lobby
            </Text>
            <Text variant="bodySm" tone="secondary">
              Соберите отряд и штурмуйте лигу. Очередь автоматически подберёт соперников схожего
              рейтинга.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {dailyBonus && (
              <Badge variant="legendary" size="sm">
                {dailyBonus}
              </Badge>
            )}
            <Badge variant="primary" size="sm">
              {friendsOnline} онлайн
            </Badge>
          </div>
        </header>

        <nav aria-label="Режимы PvP" role="tablist" className="grid gap-sm sm:grid-cols-3">
          {modes.map(mode => {
            const isActive = mode.id === activeModeId;
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleSelectMode(mode.id)}
                className={clsx(
                  'flex flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
                  isActive
                    ? 'border-featured bg-layer-overlay-strong text-text-primary shadow-elevation-2'
                    : 'border-border-layer bg-layer-overlay-soft text-text-secondary hover:bg-layer-overlay-medium'
                )}
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-title">
                    {mode.icon ?? '⚔️'}
                  </span>
                  <Text
                    as="span"
                    variant="body"
                    weight="semibold"
                    tone={isActive ? 'primary' : 'secondary'}
                  >
                    {mode.name}
                  </Text>
                </div>
                <Text as="span" variant="bodySm" tone="secondary" className="line-clamp-2">
                  {mode.description}
                </Text>
                {mode.recommended && (
                  <Badge variant="success" size="sm">
                    Рекомендуем
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        <section
          role="tabpanel"
          aria-labelledby={`mode-${activeMode.id}`}
          className="grid gap-4 lg:grid-cols-[1.2fr_1fr]"
        >
          <Panel tone="overlay" spacing="md" padding="lg" className="gap-4">
            <div className="flex flex-col gap-2">
              <Text variant="title" weight="semibold">
                {activeMode.icon ?? '⚔️'} {activeMode.name}
              </Text>
              <Text variant="body" tone="secondary">
                {activeMode.description}
              </Text>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="flex flex-col gap-2 border-border-layer bg-layer-overlay-ghost-soft">
                <Text variant="caption" tone="secondary" transform="uppercase" weight="semibold">
                  Очередь
                </Text>
                <Text variant="title" weight="bold">
                  {activeMode.queueSize ? `${activeMode.queueSize} игроков` : 'По запросу'}
                </Text>
                <Text variant="bodySm" tone="tertiary">
                  {activeMode.queueEstimate ?? 'Подбор соперников < 2 мин.'}
                </Text>
              </Card>
              <Card className="flex flex-col gap-2 border-border-layer bg-layer-overlay-ghost-soft">
                <Text variant="caption" tone="secondary" transform="uppercase" weight="semibold">
                  Карта
                </Text>
                <Text variant="title" weight="bold">
                  {activeMode.mapName ?? 'Безымянный рубеж'}
                </Text>
                <Text variant="bodySm" tone="tertiary">
                  Пул карт обновляется каждую неделю.
                </Text>
              </Card>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeMode.rewards.map(reward => (
                <Badge key={reward} variant="epic" size="sm">
                  {reward}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleJoinQueue} variant="primary" size="md">
                В очередь
              </Button>
              <Button onClick={handleViewRewards} variant="secondary" size="md">
                Награды сезона
              </Button>
            </div>
          </Panel>

          <Panel tone="overlay" spacing="md" padding="lg" className="gap-3">
            <Text variant="caption" tone="secondary" transform="uppercase" weight="semibold">
              Статус сезона
            </Text>
            <Text variant="body" tone="primary">
              Серия побед: {streakDays ?? 0} дн.
            </Text>
            <Text variant="bodySm" tone="tertiary">
              Поддерживайте серию и получайте дополнительные сундуки с шардовыми наградами.
            </Text>
            {activeMode.mapPreviewUrl && (
              <div className="overflow-hidden rounded-3xl border border-border-layer">
                <img
                  src={activeMode.mapPreviewUrl}
                  alt={`Превью карты ${activeMode.mapName ?? activeMode.name}`}
                  className="h-40 w-full object-cover"
                />
              </div>
            )}
          </Panel>
        </section>
      </Panel>
    </div>
  );
}
