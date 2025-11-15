import { useCallback, useEffect, useState } from 'react';
import { Panel } from '@/components/Panel';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { useNotification } from '@/hooks/useNotification';

export type RewardTier = 'gold' | 'silver' | 'bronze';

export interface SeasonRewardEntry {
  rank: number;
  userId: string;
  player: string;
  energyTotal: number;
  rewardStatus: 'pending' | 'granted';
  rewardTier: RewardTier;
  couponCode?: string | null;
  rewardMessage?: string | null;
}

export interface SeasonRewardsAdminPanelProps {
  seasonTitle: string;
  seasonId: string;
  endedAt: string;
  snapshotPlayers: SeasonRewardEntry[];
  isProcessing?: boolean;
  onRewardPlayer?: (
    entry: SeasonRewardEntry,
    options?: { message?: string }
  ) => Promise<void> | void;
  onExportSnapshot?: () => void;
}

const TIER_LABEL: Record<RewardTier, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const TIER_BADGE: Record<RewardTier, 'legendary' | 'epic' | 'primary'> = {
  gold: 'legendary',
  silver: 'epic',
  bronze: 'primary',
};

const TEMPLATE_STORAGE_KEY = 'season-reward-message-templates-v1';

const tierConfig: Array<{
  tier: RewardTier;
  title: string;
  emoji: string;
  helper: string;
}> = [
  {
    tier: 'gold',
    title: '1 место (Gold)',
    emoji: '🥇',
    helper: 'Чаще всего сертификаты/уникальные призы.',
  },
  {
    tier: 'silver',
    title: '2 место (Silver)',
    emoji: '🥈',
    helper: 'Например, промокоды или бонус Stars.',
  },
  {
    tier: 'bronze',
    title: '3 место (Bronze)',
    emoji: '🥉',
    helper: 'Можно поделиться ссылкой или QR на подарок.',
  },
];

type RewardTemplateState = Record<RewardTier, string>;

const DEFAULT_TEMPLATES: RewardTemplateState = {
  gold: '',
  silver: '',
  bronze: '',
};

export function SeasonRewardsAdminPanel({
  seasonTitle,
  seasonId,
  endedAt,
  snapshotPlayers,
  isProcessing = false,
  onRewardPlayer,
  onExportSnapshot,
}: SeasonRewardsAdminPanelProps) {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const [rewardingId, setRewardingId] = useState<string | null>(null);
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplateState>(DEFAULT_TEMPLATES);
  const [rewardMessages, setRewardMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as Partial<RewardTemplateState>;
      const normalized = (['gold', 'silver', 'bronze'] as RewardTier[]).reduce((acc, tier) => {
        const value = parsed?.[tier];
        if (typeof value === 'string') {
          acc[tier] = value;
        }
        return acc;
      }, {} as Partial<RewardTemplateState>);
      setRewardTemplates(prev => ({
        ...prev,
        ...normalized,
      }));
    } catch (error) {
      console.warn('Failed to load reward templates from storage', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(rewardTemplates));
  }, [rewardTemplates]);

  const getMessageValue = useCallback(
    (entry: SeasonRewardEntry) => {
      if (rewardMessages[entry.userId] !== undefined) {
        return rewardMessages[entry.userId];
      }
      if (entry.rewardMessage && entry.rewardMessage.length > 0) {
        return entry.rewardMessage;
      }
      return rewardTemplates[entry.rewardTier] ?? '';
    },
    [rewardMessages, rewardTemplates]
  );

  const handleTemplateChange = (tier: RewardTier, value: string) => {
    setRewardTemplates(prev => ({
      ...prev,
      [tier]: value,
    }));
  };

  const handleMessageChange = (userId: string, value: string) => {
    setRewardMessages(prev => ({
      ...prev,
      [userId]: value,
    }));
  };

  const handleResetMessage = (entry: SeasonRewardEntry) => {
    setRewardMessages(prev => {
      const next = { ...prev };
      if (entry.userId in next) {
        delete next[entry.userId];
      }
      return next;
    });
  };

  const handleReward = async (entry: SeasonRewardEntry) => {
    if (!onRewardPlayer) {
      return;
    }
    try {
      setRewardingId(entry.userId);
      const messageForPlayer = getMessageValue(entry).trim();
      await onRewardPlayer(entry, {
        message: messageForPlayer.length > 0 ? messageForPlayer : undefined,
      });
      if (messageForPlayer.length > 0) {
        setRewardMessages(prev => ({
          ...prev,
          [entry.userId]: messageForPlayer,
        }));
      }
      notifySuccess(`Награда ${TIER_LABEL[entry.rewardTier]} выдана игроку ${entry.player}`);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : `Не удалось наградить ${entry.player}`);
    } finally {
      setRewardingId(null);
    }
  };

  return (
    <Panel tone="overlayStrong" spacing="md" padding="lg" className="gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Text variant="title" weight="semibold">
            Season Awards — {seasonTitle}
          </Text>
          <Text variant="bodySm" tone="secondary">
            Snapshot #{seasonId} · {new Date(endedAt).toLocaleString('ru-RU')}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="legendary" size="sm">
            Top-3 rewards
          </Badge>
          <Button variant="ghost" size="sm" onClick={onExportSnapshot} disabled={isProcessing}>
            Экспорт snapshot
          </Button>
        </div>
      </header>

      <section className="rounded-3xl border border-dashed border-border-layer bg-layer-overlay-soft p-5">
        <div className="flex flex-col gap-1 mb-4">
          <Text variant="label" tone="secondary">
            Шаблоны сообщений для призёров
          </Text>
          <Text variant="bodySm" tone="tertiary">
            Этот текст автоматически подставится, если не заполнить индивидуальное сообщение.
          </Text>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tierConfig.map(config => (
            <label key={config.tier} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-body text-text-primary">
                <span aria-hidden="true">{config.emoji}</span>
                {config.title}
              </div>
              <textarea
                value={rewardTemplates[config.tier]}
                onChange={event => handleTemplateChange(config.tier, event.target.value)}
                placeholder={config.helper}
                className="min-h-[96px] rounded-2xl border border-border-layer bg-surface-primary px-3 py-2 text-bodySm text-text-primary placeholder:text-text-secondary focus:border-accent-gold focus:outline-none"
              />
              <Text variant="caption" tone="tertiary">
                {config.helper}
              </Text>
            </label>
          ))}
        </div>
      </section>

      <div className="overflow-x-auto rounded-3xl border border-border-layer bg-layer-overlay-soft">
        <table className="min-w-full text-bodySm">
          <thead className="text-caption uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Позиция</th>
              <th className="px-5 py-3 text-left font-semibold">Игрок</th>
              <th className="px-5 py-3 text-left font-semibold">Очки</th>
              <th className="px-5 py-3 text-left font-semibold">Награда</th>
              <th className="px-5 py-3 text-left font-semibold">Купон</th>
              <th className="px-5 py-3 text-left font-semibold">Сообщение игроку</th>
              <th className="px-5 py-3 text-right font-semibold">Действие</th>
            </tr>
          </thead>
          <tbody>
            {snapshotPlayers.map(entry => (
              <tr
                key={entry.userId}
                className="border-t border-border-layer/60 odd:bg-layer-overlay-ghost-soft"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={TIER_BADGE[entry.rewardTier]} size="sm">
                      #{entry.rank} {TIER_LABEL[entry.rewardTier]}
                    </Badge>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <Text as="span" variant="body" weight="semibold">
                    {entry.player}
                  </Text>
                </td>
                <td className="px-5 py-4">
                  <Text as="span" variant="bodySm" tone="secondary">
                    {entry.energyTotal.toLocaleString('ru-RU')} ⚡
                  </Text>
                </td>
                <td className="px-5 py-4">
                  <Text variant="bodySm" tone="primary">
                    {entry.rewardStatus === 'granted' ? 'Выдано' : 'Ожидает'}
                  </Text>
                </td>
                <td className="px-5 py-4 text-bodySm text-text-secondary">
                  {entry.couponCode ? (
                    <span className="rounded-xl bg-layer-overlay-ghost-soft px-3 py-1 font-mono text-caption">
                      {entry.couponCode}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <label className="flex flex-col gap-2 text-caption text-text-secondary">
                    <span>Текст сообщения</span>
                    <textarea
                      value={getMessageValue(entry)}
                      onChange={event => handleMessageChange(entry.userId, event.target.value)}
                      placeholder="Добавьте ссылку, QR или инструкцию"
                      className="min-h-[88px] rounded-2xl border border-border-layer bg-surface-primary px-3 py-2 text-bodySm text-text-primary placeholder:text-text-secondary focus:border-accent-gold focus:outline-none"
                      disabled={entry.rewardStatus === 'granted'}
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-caption">
                    <button
                      type="button"
                      className="text-accent-gold transition-colors hover:underline disabled:text-text-tertiary"
                      onClick={() => handleResetMessage(entry)}
                      disabled={entry.rewardStatus === 'granted'}
                    >
                      Сбросить к шаблону
                    </button>
                    <span className="text-text-tertiary">
                      По умолчанию: {rewardTemplates[entry.rewardTier]?.length ? 'есть' : 'нет'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-right">
                  <Button
                    size="sm"
                    variant={entry.rewardStatus === 'granted' ? 'secondary' : 'success'}
                    disabled={isProcessing || entry.rewardStatus === 'granted'}
                    loading={rewardingId === entry.userId}
                    onClick={() => handleReward(entry)}
                  >
                    {entry.rewardStatus === 'granted' ? 'Готово' : 'Выдать приз'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="grid gap-3 md:grid-cols-2">
        <Panel tone="overlay" spacing="sm" padding="lg" className="gap-2">
          <Text variant="caption" transform="uppercase" tone="secondary" weight="semibold">
            Регламент
          </Text>
          <Text variant="bodySm" tone="primary">
            Платежи оформляются вручную. После выдачи купона событие фиксируется в журнале events
            (`season_reward_granted`).
          </Text>
        </Panel>
        <Panel tone="overlay" spacing="sm" padding="lg" className="gap-2">
          <Text variant="caption" transform="uppercase" tone="secondary" weight="semibold">
            Напоминание
          </Text>
          <ul className="list-disc pl-5 text-left text-bodySm text-text-tertiary">
            <li>Проверьте данные игрока перед отправкой купона.</li>
            <li>Согласуйте призы с маркетингом (`docs/design/seasonal-rewards.md`).</li>
            <li>Обновите release notes Stage F после выдачи.</li>
          </ul>
        </Panel>
      </section>
    </Panel>
  );
}
