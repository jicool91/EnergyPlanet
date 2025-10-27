import { useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { LeaderboardSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';
import { formatCompactNumber } from '../utils/number';
import { logClientEvent } from '@/services/telemetry';
import { useShallow } from 'zustand/react/shallow';
import { Button } from './Button';

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

  useEffect(() => {
    if (userEnergyDiffToNext > 0 && !hasLoggedShopCtaRef.current) {
      hasLoggedShopCtaRef.current = true;
      void logClientEvent('leaderboard_shop_cta_view', {
        deficit: userEnergyDiffToNext,
      });
    }
    if (userEnergyDiffToNext === 0) {
      hasLoggedShopCtaRef.current = false;
    }
  }, [userEnergyDiffToNext]);

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
        <Card className="flex items-start gap-sm-plus bg-[var(--color-text-destructive)]/10 border-[var(--color-text-destructive)]/40 text-[var(--color-text-destructive)]">
          <span className="text-xl" role="img" aria-label="Leaderboard error">
            ❌
          </span>
          <div>
            <p className="m-0 mb-sm font-semibold text-token-primary">
              Не удалось получить рейтинг
            </p>
            <small className="text-[var(--color-text-secondary)]">{leaderboardError}</small>
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
        <span className="text-caption text-[var(--color-text-secondary)]">
          Всего: {leaderboardTotal.toLocaleString()}
        </span>
      </div>

      {/* User Rank Progress (if user exists) */}
      {userLeaderboardEntry && (
        <Card className="bg-gradient-to-r from-cyan/20 to-lime/20 border-cyan/40">
          <div className="mb-sm-plus flex items-center justify-between gap-sm-plus">
            <div>
              <p className="m-0 text-xs uppercase tracking-[0.5px] text-token-secondary">
                Ваша позиция
              </p>
              <p className="m-0 text-sm font-bold">
                #{userLeaderboardEntry.rank} из {leaderboardTotal}
              </p>
            </div>
            <div className="text-right">
              <p className="m-0 text-xs text-token-secondary">Top</p>
              <p className="m-0 text-sm font-bold text-lime">{Math.round(userRankProgress)}%</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-token-track overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan to-lime"
              initial={{ width: 0 }}
              animate={{ width: `${userRankProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          {userEnergyDiffDisplay && (
            <div className="mt-sm flex flex-wrap items-center justify-between gap-sm-plus text-caption">
              <span className="text-[var(--color-text-secondary)]">
                До следующего места: {userEnergyDiffDisplay} E
              </span>
              <Button size="sm" variant="primary" onClick={handleShopCtaClick}>
                🚀 Усилить меня
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Table Container */}
      <Card className="overflow-hidden p-0">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-caption">
            <thead>
              <tr>
                <th className="px-sm-plus py-sm-plus text-left border-b border-token-muted font-semibold text-token-secondary text-xs uppercase">
                  #
                </th>
                <th className="px-sm-plus py-sm-plus text-left border-b border-token-muted font-semibold text-token-secondary text-xs uppercase">
                  Игрок
                </th>
                <th className="px-sm-plus py-sm-plus text-left border-b border-token-muted font-semibold text-token-secondary text-xs uppercase">
                  Уровень
                </th>
                <th className="px-sm-plus py-sm-plus text-left border-b border-token-muted font-semibold text-token-secondary text-xs uppercase">
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
                    animate={isCurrentUser ? { backgroundColor: 'rgba(0, 217, 255, 0.2)' } : {}}
                    className={`border-b border-token-muted hover:bg-cyan/[0.08] transition-colors ${
                      isCurrentUser ? 'bg-cyan/[0.15] font-semibold' : ''
                    }`}
                  >
                    {/* Rank with Medal */}
                    <td className="px-sm-plus py-sm-plus text-center">
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
                    <td className="px-sm-plus py-sm-plus text-left">
                      <div className="flex items-center gap-sm">
                        <div className="flex flex-col gap-[2px] flex-1">
                          <span
                            className={`font-semibold ${isCurrentUser ? 'text-cyan' : 'text-token-primary'}`}
                          >
                            {entry.username || entry.first_name || 'Игрок'}
                            {isCurrentUser && ' ⭐'}
                          </span>
                          <span className="text-micro text-[var(--color-text-secondary)]">
                            #{entry.user_id.slice(0, 6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Level */}
                    <td className="px-sm-plus py-sm-plus text-left font-semibold">{entry.level}</td>

                    {/* Energy + Diff */}
                    <td className="px-sm-plus py-sm-plus text-left">
                      <div className="flex flex-col gap-[2px]">
                        <span className="font-semibold">{entry.energyDisplay}</span>
                        {entry.energyDiffDisplay && (
                          <span className="text-micro text-[var(--color-text-secondary)]">
                            -{entry.energyDiffDisplay}
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
                className={`rounded-lg border border-token-muted backdrop-blur-sm px-md py-sm-plus flex flex-col gap-sm transition-colors max-[360px]:px-sm-plus max-[320px]:px-xs ${
                  isCurrentUser ? 'bg-cyan/15 border-cyan/40' : 'bg-token-surface'
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
                          isCurrentUser ? 'text-cyan' : 'text-token-primary'
                        } max-[360px]:text-sm max-[320px]:text-xs`}
                      >
                        #{entry.rank} {entry.username || entry.first_name || 'Игрок'}
                      </span>
                      <span className="text-micro text-[var(--color-text-secondary)]">
                        ID {entry.user_id.slice(0, 6)}
                      </span>
                    </div>
                  </div>
                  <span className="text-heading font-semibold max-[360px]:text-base">
                    {entry.level}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-xs text-sm text-token-secondary max-[360px]:text-xs">
                  <span>Энергия</span>
                  <span className="font-medium text-token-primary">{entry.energyDisplay}</span>
                </div>
                {entry.energyDiffDisplay && (
                  <div className="text-caption text-[var(--color-text-secondary)] max-[360px]:text-[10px]">
                    До следующего: -{entry.energyDiffDisplay}
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
