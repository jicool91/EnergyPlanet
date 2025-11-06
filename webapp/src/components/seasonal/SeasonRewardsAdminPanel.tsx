import { useState } from 'react';
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
}

export interface SeasonRewardsAdminPanelProps {
  seasonTitle: string;
  seasonId: string;
  endedAt: string;
  snapshotPlayers: SeasonRewardEntry[];
  isProcessing?: boolean;
  onRewardPlayer?: (entry: SeasonRewardEntry) => Promise<void> | void;
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

  const handleReward = async (entry: SeasonRewardEntry) => {
    if (!onRewardPlayer) {
      return;
    }
    try {
      setRewardingId(entry.userId);
      await onRewardPlayer(entry);
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

      <div className="overflow-x-auto rounded-3xl border border-border-layer bg-layer-overlay-soft">
        <table className="min-w-full text-bodySm">
          <thead className="text-caption uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Позиция</th>
              <th className="px-5 py-3 text-left font-semibold">Игрок</th>
              <th className="px-5 py-3 text-left font-semibold">Очки</th>
              <th className="px-5 py-3 text-left font-semibold">Награда</th>
              <th className="px-5 py-3 text-left font-semibold">Купон</th>
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
