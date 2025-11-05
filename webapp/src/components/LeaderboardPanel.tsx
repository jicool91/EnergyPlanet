import { useEffect, useMemo, useRef, useCallback, useReducer } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { LeaderboardSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';
import { formatCompactNumber } from '../utils/number';
import { logClientEvent } from '@/services/telemetry';
import { useShallow } from 'zustand/react/shallow';
import { Button } from './Button';
import { canShowCap, consumeCap } from '@/utils/frequencyCap';

// Medal emojis for top 3
const MEDAL_MAP: Record<number, { icon: string; label: string }> = {
  1: { icon: '🥇', label: 'First place' },
  2: { icon: '🥈', label: 'Second place' },
  3: { icon: '🥉', label: 'Third place' },
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

  // Calculate energy difference to next player
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

  // Calculate player progress in leaderboard (what percentage is their rank)
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
      <div className="flex flex-col gap-md" role="alert">
        <Card className="flex items-start gap-sm-plus bg-state-danger-pill border-state-danger-pill text-feedback-error">
          <span className="text-xl" role="img" aria-label="Leaderboard error">
            ❌
          </span>
          <div>
            <p className="m-0 mb-sm font-semibold text-token-primary">
              Не удалось получить рейтинг
            </p>
            <small className="text-text-secondary">{leaderboardError}</small>
          </div>
        </Card>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-md text-center text-token-secondary">
        <p>Ещё никто не попал в рейтинг. Будь первым!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md text-token-primary">
      {/* Header */}
      <div className="flex items-center justify-between gap-sm-plus">
        <h3 className="m-0 text-heading font-semibold">Топ игроков</h3>
        <span className="text-caption text-text-secondary">
          Всего: {leaderboardTotal.toLocaleString()}
        </span>
      </div>

      {/* User Rank Progress (if user exists) */}
      {userLeaderboardEntry && (
        <Card className="relative overflow-hidden rounded-2xl border border-border-cyan bg-surface-glass-strong shadow-glow">
          <div className="absolute inset-0 bg-gradient-soft opacity-40" aria-hidden />
          <div className="relative flex flex-col gap-md">
            <div className="flex flex-wrap items-start justify-between gap-sm-plus">
              <div className="flex flex-col gap-xs">
                <span className="inline-flex items-center gap-xs rounded-full bg-layer-overlay-ghost-strong px-sm py-xs text-label uppercase text-white/70">
                  Ваша позиция
                </span>
                <h3 className="m-0 text-title font-bold text-white">
                  #{userLeaderboardEntry.rank} из {leaderboardTotal}
                </h3>
                <p className="m-0 text-body-sm text-white/75">
                  {userEnergyDiffDisplay
                    ? `До следующего места осталось ${userEnergyDiffDisplay} E`
                    : 'Вы на вершине рейтинга — так держать!'}
                </p>
              </div>
              <div className="text-right">
                <span className="block text-label uppercase text-white/60">Top</span>
                <span className="block text-heading font-bold text-white">
                  {Math.round(userRankProgress)}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <div className="h-3 rounded-full bg-layer-overlay-ghost-soft shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent-cyan via-feedback-success to-accent-gold shadow-glow"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(6, userRankProgress)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-sm text-body-sm text-white/75">
                <span>Всего игроков: {leaderboardTotal.toLocaleString()}</span>
                <span>Текущая энергия: {userLeaderboardRow?.energyDisplay}</span>
              </div>
            </div>

            {showShopCta && (
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <span className="text-body-sm text-white/70">
                  Усилитесь, чтобы обойти соперников
                </span>
                <Button
                  size="sm"
                  variant="primary"
                  className="shadow-glow"
                  onClick={handleShopCtaClick}
                >
                  🚀 Усилить меня
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Table Container */}
      <Card className="overflow-hidden rounded-2xl border border-border-cyan bg-surface-glass-strong shadow-elevation-2 p-0">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-body-sm text-white/75">
            <thead>
              <tr>
                <th className="px-md py-sm-plus text-left border-b border-border-layer font-semibold text-white/60 text-label">
                  #
                </th>
                <th className="px-md py-sm-plus text-left border-b border-border-layer font-semibold text-white/60 text-label">
                  Игрок
                </th>
                <th className="px-md py-sm-plus text-left border-b border-border-layer font-semibold text-white/60 text-label">
                  Уровень
                </th>
                <th className="px-md py-sm-plus text-left border-b border-border-layer font-semibold text-white/60 text-label">
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
                    animate={isCurrentUser ? { backgroundColor: 'rgba(0, 217, 255, 0.18)' } : {}}
                    className={`border-b border-border-subtle hover:bg-state-cyan-pill-soft transition-colors ${
                      isCurrentUser ? 'bg-state-cyan-pill-glow font-semibold text-white' : ''
                    }`}
                  >
                    {/* Rank with Medal */}
                    <td className="px-md py-sm-plus text-center text-text-primary">
                      <div className="flex items-center justify-center gap-xs">
                        {medal && (
                          <span className="text-lg" role="img" aria-label={medal.label}>
                            {medal.icon}
                          </span>
                        )}
                        <span className="font-bold">{entry.rank}</span>
                      </div>
                    </td>

                    {/* Player Name */}
                    <td className="px-md py-sm-plus text-left">
                      <div className="flex items-center gap-sm">
                        <div className="flex flex-col gap-[2px] flex-1">
                          <span
                            className={`font-semibold ${
                              isCurrentUser ? 'text-accent-cyan' : 'text-text-primary'
                            }`}
                          >
                            {entry.username || entry.first_name || 'Игрок'}
                            {isCurrentUser && ' ⭐'}
                          </span>
                          <span className="text-micro text-white/60">
                            #{entry.user_id.slice(0, 6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-md py-sm-plus text-left font-semibold text-text-primary">
                      {entry.level}
                    </td>

                    {/* Energy + Diff */}
                    <td className="px-md py-sm-plus text-left">
                      <div className="flex flex-col gap-[2px] text-text-primary">
                        <span className="font-semibold">{entry.energyDisplay}</span>
                        {entry.energyDiffDisplay && (
                          <span className="text-micro text-white/60">
                            До следующего: {entry.energyDiffDisplay}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="sm:hidden flex flex-col gap-sm p-sm-plus">
          {rowsWithDiff.map(entry => {
            const isCurrentUser = entry.user_id === userLeaderboardEntry?.user_id;
            const medal = MEDAL_MAP[entry.rank];

            return (
              <motion.div
                key={entry.user_id}
                initial={false}
                animate={isCurrentUser ? { backgroundColor: 'rgba(0, 217, 255, 0.2)' } : {}}
                className={`rounded-xl border border-layer-strong backdrop-blur-sm px-md py-sm-plus flex flex-col gap-sm transition-colors max-[360px]:px-sm-plus max-[320px]:px-xs ${
                  isCurrentUser
                    ? 'bg-state-cyan-pill-strong text-white'
                    : 'bg-surface-glass-strong text-white/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <div className="flex items-center gap-sm max-[360px]:gap-xs">
                    {medal && (
                      <span className="text-lg" role="img" aria-label={medal.label}>
                        {medal.icon}
                      </span>
                    )}
                    <div className="flex flex-col leading-tight">
                      <span
                        className={`font-semibold ${
                          isCurrentUser ? 'text-accent-cyan' : 'text-white'
                        } max-[360px]:text-sm max-[320px]:text-xs`}
                      >
                        #{entry.rank} {entry.username || entry.first_name || 'Игрок'}
                      </span>
                      <span className="text-micro text-white/60">
                        ID {entry.user_id.slice(0, 6)}
                      </span>
                    </div>
                  </div>
                  <span className="text-title font-semibold max-[360px]:text-base text-white">
                    {entry.level}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-xs text-body-sm text-white/75 max-[360px]:text-xs">
                  <span>Энергия</span>
                  <span className="font-medium text-white">{entry.energyDisplay}</span>
                </div>
                {entry.energyDiffDisplay && (
                  <div className="text-micro text-white/60">
                    До следующего: {entry.energyDiffDisplay}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>
      {/* User Rank (if not in top 100) */}
      {userLeaderboardEntry &&
        !rows.some(entry => entry.user_id === userLeaderboardEntry.user_id) && (
          <Card className="bg-cyan/15 flex items-center justify-center gap-sm-plus py-sm-plus">
            <span className="text-caption">Место</span>
            <strong className="text-heading">{userLeaderboardEntry.rank}</strong>
            <span className="text-caption">{userLeaderboardEntry.username || 'Вы'}</span>
          </Card>
        )}
    </div>
  );
}
