import { useEffect, useMemo, useRef, useCallback, useReducer } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../store/gameStore';
import { LeaderboardSkeleton, ErrorBoundary } from './skeletons';
import { Panel } from './Panel';
import { Surface } from './ui/Surface';
import { Text } from './ui/Text';
import { Badge } from './Badge';
import { Button } from './Button';
import { formatCompactNumber } from '../utils/number';
import { logClientEvent } from '@/services/telemetry';
import { canShowCap, consumeCap } from '@/utils/frequencyCap';

const MEDAL_MAP: Record<number, { icon: string; label: string }> = {
  1: { icon: '🥇', label: 'Первое место' },
  2: { icon: '🥈', label: 'Второе место' },
  3: { icon: '🥉', label: 'Третье место' },
};

interface LeaderboardPanelProps {
  onOpenShop?: (section?: 'star_packs' | 'boosts') => void;
}

export function LeaderboardPanel({ onOpenShop }: LeaderboardPanelProps) {
  const {
    leaderboard,
    leaderboardLoaded,
    isLeaderboardLoading,
    leaderboardError,
    leaderboardTotal,
    userLeaderboardEntry,
    userId,
  } = useGameStore(
    useShallow(state => ({
      leaderboard: state.leaderboardEntries,
      leaderboardLoaded: state.leaderboardLoaded,
      isLeaderboardLoading: state.isLeaderboardLoading,
      leaderboardError: state.leaderboardError,
      leaderboardTotal: state.leaderboardTotal,
      userLeaderboardEntry: state.userLeaderboardEntry,
      userId: state.userId,
    }))
  );

  const [, forceLeaderboardCapRefresh] = useReducer((state: number) => state + 1, 0);
  const leaderboardCtaAllowed = canShowCap('leaderboard_shop_cta', { limit: 2 });

  useEffect(() => {
    if (leaderboardError) {
      void logClientEvent('leaderboard_panel_error', { userId, message: leaderboardError }, 'warn');
    }
  }, [leaderboardError, userId]);

  useEffect(() => {
    if (!leaderboardLoaded || isLeaderboardLoading || leaderboardError) {
      return;
    }
    if (leaderboard.length === 0) {
      void logClientEvent('leaderboard_panel_empty', { userId }, 'warn');
    } else {
      void logClientEvent('leaderboard_panel_render', {
        userId,
        entries: leaderboard.length,
        sample: leaderboard.slice(0, 3).map(entry => ({
          rank: entry.rank,
          username: entry.username ?? entry.first_name ?? 'Игрок',
          energy: entry.total_energy_produced,
        })),
      });
    }
  }, [leaderboardLoaded, isLeaderboardLoading, leaderboardError, leaderboard, userId]);

  const rows = useMemo(() => leaderboard.slice(0, 100), [leaderboard]);

  const rowsWithDiff = useMemo(
    () =>
      rows.map((entry, index) => {
        const totalEnergy = Math.max(0, Math.floor(entry.total_energy_produced));
        const diff =
          index < rows.length - 1
            ? Math.max(0, rows[index + 1].total_energy_produced - entry.total_energy_produced)
            : 0;

        return {
          ...entry,
          energyDiffToNext: diff,
          energyDisplay: formatCompactNumber(totalEnergy),
          energyDiffDisplay: diff > 0 ? formatCompactNumber(Math.floor(diff)) : null,
        };
      }),
    [rows]
  );

  const userRankProgress = userLeaderboardEntry
    ? Math.max(0, 100 - (userLeaderboardEntry.rank / leaderboardTotal) * 100)
    : 0;
  const userLeaderboardRow = useMemo(
    () => rowsWithDiff.find(entry => entry.user_id === userLeaderboardEntry?.user_id) ?? null,
    [rowsWithDiff, userLeaderboardEntry]
  );
  const userEnergyDiffToNext = userLeaderboardRow?.energyDiffToNext ?? 0;
  const userEnergyDiffDisplay = useMemo(
    () => (userEnergyDiffToNext > 0 ? formatCompactNumber(Math.floor(userEnergyDiffToNext)) : null),
    [userEnergyDiffToNext]
  );
  const hasLoggedShopCtaRef = useRef(false);
  const showShopCta = leaderboardCtaAllowed && userEnergyDiffToNext > 0;

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const refreshCap = () => {
      hasLoggedShopCtaRef.current = false;
      forceLeaderboardCapRefresh();
    };
    document.addEventListener('visibilitychange', refreshCap);
    window.addEventListener('focus', refreshCap);
    return () => {
      document.removeEventListener('visibilitychange', refreshCap);
      window.removeEventListener('focus', refreshCap);
    };
  }, []);

  useEffect(() => {
    if (!showShopCta) {
      if (userEnergyDiffToNext === 0) {
        hasLoggedShopCtaRef.current = false;
      }
      return;
    }

    if (!hasLoggedShopCtaRef.current) {
      const consumed = consumeCap('leaderboard_shop_cta', { limit: 2 });
      if (consumed) {
        hasLoggedShopCtaRef.current = true;
        forceLeaderboardCapRefresh();
        void logClientEvent('leaderboard_shop_cta_view', {
          deficit: userEnergyDiffToNext,
        });
      }
    }
  }, [showShopCta, userEnergyDiffToNext]);

  const handleShopCtaClick = useCallback(() => {
    void logClientEvent('leaderboard_shop_cta_click', {
      deficit: userEnergyDiffToNext,
    });
    onOpenShop?.('boosts');
  }, [onOpenShop, userEnergyDiffToNext]);

  if (!leaderboardLoaded && isLeaderboardLoading) {
    return (
      <ErrorBoundary>
        <LeaderboardSkeleton count={5} />
      </ErrorBoundary>
    );
  }

  if (leaderboardError) {
    return (
      <Panel
        variant="muted"
        tone="overlayStrong"
        border="accent"
        spacing="sm"
        role="alert"
        aria-live="assertive"
        className="text-text-primary"
      >
        <div className="flex items-start gap-sm">
          <Text as="span" variant="title" aria-hidden="true">
            ❌
          </Text>
          <div className="flex flex-col gap-xs">
            <Text as="p" variant="body" weight="semibold" className="m-0">
              Не удалось получить рейтинг
            </Text>
            <Text as="p" variant="bodySm" tone="secondary" className="m-0">
              {leaderboardError}
            </Text>
          </div>
        </div>
      </Panel>
    );
  }

  if (rows.length === 0) {
    return (
      <Panel tone="overlay" border="subtle" spacing="md" className="items-center text-center">
        <Text variant="body" tone="secondary">
          Таблица пустая — станьте первым, кто произведёт энергию и попадёт в топ!
        </Text>
      </Panel>
    );
  }

  return (
    <Panel
      tone="overlayStrong"
      border="subtle"
      elevation="medium"
      spacing="lg"
      className="text-text-primary"
    >
      <header className="flex flex-col gap-xs sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-xs">
          <Text as="h2" variant="title" weight="semibold" className="m-0">
            Топ игроков
          </Text>
          <Text variant="caption" tone="secondary" className="m-0">
            Обновляем лидерборд каждые 10 минут, значения приводятся в энергиях (E).
          </Text>
        </div>
        <Text as="span" variant="caption" tone="secondary">
          Всего: {leaderboardTotal.toLocaleString('ru-RU')}
        </Text>
      </header>

      {userLeaderboardEntry && (
        <Panel
          variant="accent"
          tone="accent"
          border="accent"
          elevation="medium"
          spacing="md"
          className="relative overflow-hidden text-text-inverse"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent-cyan/30 via-feedback-success/25 to-accent-magenta/30 opacity-90"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-lg">
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div className="flex flex-col gap-sm">
                <Badge
                  variant="primary"
                  size="sm"
                  className="bg-white/12 text-text-inverse border-white/20 font-medium uppercase tracking-[0.14em]"
                >
                  Ваша позиция
                </Badge>
                <Text as="p" variant="hero" weight="bold" className="m-0">
                  #{userLeaderboardEntry.rank} из {leaderboardTotal.toLocaleString('ru-RU')}
                </Text>
                <Text as="p" variant="body" tone="inverse" className="m-0 opacity-80">
                  {userEnergyDiffDisplay
                    ? `До следующего места: ${userEnergyDiffDisplay} E`
                    : 'Вы на вершине рейтинга — так держать!'}
                </Text>
              </div>
              <div className="flex flex-col items-end gap-xs">
                <Text variant="label" tone="inverse" transform="uppercase" className="opacity-70">
                  Прогресс
                </Text>
                <Text variant="heading" weight="bold" tone="inverse">
                  {Math.round(userRankProgress)}%
                </Text>
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <div className="h-3 rounded-full bg-white/15">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent-cyan via-feedback-success to-accent-gold shadow-glow"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, userRankProgress)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <Text variant="caption" tone="inverse" className="opacity-80">
                  Всего игроков: {leaderboardTotal.toLocaleString('ru-RU')}
                </Text>
                <Text variant="caption" tone="inverse" className="opacity-80">
                  Текущая энергия: {userLeaderboardRow?.energyDisplay ?? '—'}
                </Text>
              </div>
            </div>

            {showShopCta && (
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <Text variant="bodySm" tone="inverse" className="opacity-80">
                  Усильтесь, чтобы обойти соперников
                </Text>
                <Button size="sm" variant="primary" onClick={handleShopCtaClick}>
                  🚀 Усилить меня
                </Button>
              </div>
            )}
          </div>
        </Panel>
      )}

      <Panel
        tone="overlay"
        border="strong"
        elevation="soft"
        padding="none"
        spacing="none"
        className="overflow-hidden"
      >
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[560px] border-collapse text-body-sm text-text-secondary">
            <thead className="bg-layer-overlay-ghost-soft">
              <tr>
                <th className="px-lg py-sm-plus text-left text-label font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                  #
                </th>
                <th className="px-lg py-sm-plus text-left text-label font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                  Игрок
                </th>
                <th className="px-lg py-sm-plus text-left text-label font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                  Уровень
                </th>
                <th className="px-lg py-sm-plus text-left text-label font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                  Энергия
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsWithDiff.map(entry => {
                const isCurrentUser = entry.user_id === userLeaderboardEntry?.user_id;
                const medal = MEDAL_MAP[entry.rank];
                return (
                  <motion.tr
                    key={entry.user_id}
                    initial={false}
                    animate={isCurrentUser ? { backgroundColor: 'rgba(31, 196, 215, 0.22)' } : {}}
                    className={clsx(
                      'border-t border-border-layer transition-colors',
                      isCurrentUser
                        ? 'bg-state-cyan-pill-soft font-semibold text-text-primary'
                        : 'hover:bg-layer-overlay-ghost-soft'
                    )}
                  >
                    <td className="px-lg py-sm-plus">
                      <div className="flex items-center gap-sm">
                        {medal ? (
                          <span className="text-title" role="img" aria-label={medal.label}>
                            {medal.icon}
                          </span>
                        ) : null}
                        <Text as="span" variant="bodySm" weight="semibold">
                          {entry.rank}
                        </Text>
                      </div>
                    </td>
                    <td className="px-lg py-sm-plus">
                      <div className="flex flex-col gap-[2px]">
                        <Text
                          as="span"
                          variant="bodySm"
                          weight="semibold"
                          tone={isCurrentUser ? 'accent' : 'primary'}
                          className="truncate"
                        >
                          {entry.username || entry.first_name || 'Игрок'}
                          {isCurrentUser ? ' ⭐' : ''}
                        </Text>
                        <Text as="span" variant="micro" tone="tertiary">
                          #{entry.user_id.slice(0, 6)}
                        </Text>
                      </div>
                    </td>
                    <td className="px-lg py-sm-plus">
                      <Text as="span" variant="bodySm" weight="semibold">
                        {entry.level}
                      </Text>
                    </td>
                    <td className="px-lg py-sm-plus">
                      <div className="flex flex-col gap-[2px]">
                        <Text as="span" variant="bodySm" weight="semibold">
                          {entry.energyDisplay}
                        </Text>
                        {entry.energyDiffDisplay ? (
                          <Text as="span" variant="micro" tone="tertiary">
                            До следующего: {entry.energyDiffDisplay}
                          </Text>
                        ) : null}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-sm p-md sm:hidden">
          {rowsWithDiff.map(entry => {
            const isCurrentUser = entry.user_id === userLeaderboardEntry?.user_id;
            const medal = MEDAL_MAP[entry.rank];
            return (
              <motion.div
                key={entry.user_id}
                initial={false}
                animate={
                  isCurrentUser
                    ? { backgroundColor: 'rgba(31, 196, 215, 0.28)', scale: 1.01 }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3 }}
              >
                <Surface
                  tone={isCurrentUser ? 'accent' : 'overlay'}
                  border={isCurrentUser ? 'accent' : 'subtle'}
                  elevation={isCurrentUser ? 'medium' : 'soft'}
                  padding="md"
                  rounded="3xl"
                  className={clsx(
                    'flex flex-col gap-sm',
                    isCurrentUser ? 'text-text-inverse' : 'text-text-primary'
                  )}
                >
                  <div className="flex items-start justify-between gap-sm">
                    <div className="flex items-center gap-sm">
                      {medal ? (
                        <span className="text-title" role="img" aria-label={medal.label}>
                          {medal.icon}
                        </span>
                      ) : null}
                      <div className="flex flex-col leading-tight">
                        <Text
                          as="span"
                          variant="body"
                          weight="semibold"
                          tone={isCurrentUser ? 'inverse' : 'primary'}
                          className="truncate"
                        >
                          #{entry.rank} {entry.username || entry.first_name || 'Игрок'}
                        </Text>
                        <Text
                          as="span"
                          variant="micro"
                          tone={isCurrentUser ? 'inverse' : 'tertiary'}
                          className="opacity-80"
                        >
                          ID {entry.user_id.slice(0, 6)}
                        </Text>
                      </div>
                    </div>
                    <Text
                      as="span"
                      variant="title"
                      weight="semibold"
                      tone={isCurrentUser ? 'inverse' : 'primary'}
                    >
                      {entry.level}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <Text variant="bodySm" tone={isCurrentUser ? 'inverse' : 'secondary'}>
                      Энергия
                    </Text>
                    <Text
                      variant="bodySm"
                      weight="semibold"
                      tone={isCurrentUser ? 'inverse' : 'primary'}
                    >
                      {entry.energyDisplay}
                    </Text>
                  </div>
                  {entry.energyDiffDisplay ? (
                    <Text variant="micro" tone={isCurrentUser ? 'inverse' : 'tertiary'}>
                      До следующего: {entry.energyDiffDisplay}
                    </Text>
                  ) : null}
                </Surface>
              </motion.div>
            );
          })}
        </div>
      </Panel>

      {userLeaderboardEntry &&
        !rows.some(entry => entry.user_id === userLeaderboardEntry.user_id) && (
          <Surface
            tone="overlay"
            border="accent"
            elevation="soft"
            padding="md"
            rounded="3xl"
            className="flex items-center justify-center gap-sm"
          >
            <Text variant="caption" tone="secondary">
              Место
            </Text>
            <Text variant="heading" weight="bold">
              {userLeaderboardEntry.rank}
            </Text>
            <Text variant="caption" tone="secondary">
              {userLeaderboardEntry.username ?? userLeaderboardEntry.first_name ?? 'Вы'}
            </Text>
          </Surface>
        )}
    </Panel>
  );
}
