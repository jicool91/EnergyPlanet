import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { LeaderboardSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';

// Medal emojis for top 3
const MEDAL_MAP: Record<number, { icon: string; label: string }> = {
  1: { icon: '🥇', label: 'First place' },
  2: { icon: '🥈', label: 'Second place' },
  3: { icon: '🥉', label: 'Third place' },
};

export function LeaderboardPanel() {
  const {
    leaderboard,
    leaderboardLoaded,
    isLeaderboardLoading,
    leaderboardError,
    leaderboardTotal,
    userLeaderboardEntry,
  } = useGameStore(state => ({
    leaderboard: state.leaderboardEntries,
    leaderboardLoaded: state.leaderboardLoaded,
    isLeaderboardLoading: state.isLeaderboardLoading,
    leaderboardError: state.leaderboardError,
    leaderboardTotal: state.leaderboardTotal,
    userLeaderboardEntry: state.userLeaderboardEntry,
  }));

  const rows = useMemo(() => leaderboard.slice(0, 100), [leaderboard]);

  // Calculate energy difference to next player
  const rowsWithDiff = useMemo(
    () =>
      rows.map((entry, index) => ({
        ...entry,
        energyDiffToNext:
          index < rows.length - 1
            ? Math.max(0, rows[index + 1].total_energy_produced - entry.total_energy_produced)
            : 0,
      })),
    [rows]
  );

  // Calculate player progress in leaderboard (what percentage is their rank)
  const userRankProgress = userLeaderboardEntry
    ? Math.max(0, 100 - (userLeaderboardEntry.rank / leaderboardTotal) * 100)
    : 0;

  if (!leaderboardLoaded && isLeaderboardLoading) {
    return (
      <ErrorBoundary>
        <LeaderboardSkeleton count={5} />
      </ErrorBoundary>
    );
  }

  if (leaderboardError) {
    return (
      <div className="p-0 flex flex-col gap-4">
        <Card className="bg-red-error/15 border-red-error/40 text-red-error">
          <p className="m-0 mb-2 font-semibold">Не удалось получить рейтинг.</p>
          <small className="text-white/60">{leaderboardError}</small>
        </Card>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-0 flex flex-col gap-4 items-center justify-center text-center text-white/70">
        <p>Ещё никто не попал в рейтинг. Будь первым!</p>
      </div>
    );
  }

  return (
    <div className="p-0 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-heading font-semibold text-white">Топ игроков</h3>
        <span className="text-caption text-white/55">
          Всего: {leaderboardTotal.toLocaleString()}
        </span>
      </div>

      {/* User Rank Progress (if user exists) */}
      {userLeaderboardEntry && (
        <Card className="bg-gradient-to-r from-cyan/20 to-lime/20 border-cyan/40">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <p className="m-0 text-xs uppercase tracking-[0.5px] text-white/60">Ваша позиция</p>
              <p className="m-0 text-sm font-bold text-white">
                #{userLeaderboardEntry.rank} из {leaderboardTotal}
              </p>
            </div>
            <div className="text-right">
              <p className="m-0 text-xs text-white/60">Top</p>
              <p className="m-0 text-sm font-bold text-lime">{Math.round(userRankProgress)}%</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan to-lime"
              initial={{ width: 0 }}
              animate={{ width: `${userRankProgress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </Card>
      )}

      {/* Table Container */}
      <Card className="overflow-hidden p-0">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="px-[14px] py-3 text-left border-b border-white/[0.04] font-semibold text-white/70 text-xs uppercase">
                #
              </th>
              <th className="px-[14px] py-3 text-left border-b border-white/[0.04] font-semibold text-white/70 text-xs uppercase">
                Игрок
              </th>
              <th className="px-[14px] py-3 text-left border-b border-white/[0.04] font-semibold text-white/70 text-xs uppercase">
                Уровень
              </th>
              <th className="px-[14px] py-3 text-left border-b border-white/[0.04] font-semibold text-white/70 text-xs uppercase">
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
                  className={`border-b border-white/[0.04] hover:bg-cyan/[0.08] transition-colors ${
                    isCurrentUser ? 'bg-cyan/[0.15] font-semibold' : ''
                  }`}
                >
                  {/* Rank with Medal */}
                  <td className="px-[14px] py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {medal && (
                        <span className="text-lg" role="img" aria-label={medal.label}>
                          {medal.icon}
                        </span>
                      )}
                      <span className="font-bold text-white">{entry.rank}</span>
                    </div>
                  </td>

                  {/* Player Name */}
                  <td className="px-[14px] py-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-[2px] flex-1">
                        <span
                          className={`font-semibold ${isCurrentUser ? 'text-cyan' : 'text-white'}`}
                        >
                          {entry.username || entry.first_name || 'Игрок'}
                          {isCurrentUser && ' ⭐'}
                        </span>
                        <span className="text-[11px] text-white/40">
                          #{entry.user_id.slice(0, 6)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Level */}
                  <td className="px-[14px] py-3 text-left font-semibold">{entry.level}</td>

                  {/* Energy + Diff */}
                  <td className="px-[14px] py-3 text-left">
                    <div className="flex flex-col gap-[2px]">
                      <span className="font-semibold text-white">
                        {Math.floor(entry.total_energy_produced).toLocaleString()}
                      </span>
                      {entry.energyDiffToNext > 0 && (
                        <span className="text-[11px] text-white/50">
                          -{Math.floor(entry.energyDiffToNext).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {/* User Rank (if not in top 100) */}
      {userLeaderboardEntry &&
        !rows.some(entry => entry.user_id === userLeaderboardEntry.user_id) && (
          <Card className="bg-cyan/15 flex gap-3 items-center justify-center py-3">
            <span className="text-caption">Место</span>
            <strong className="text-heading">{userLeaderboardEntry.rank}</strong>
            <span className="text-caption">{userLeaderboardEntry.username || 'Вы'}</span>
          </Card>
        )}
    </div>
  );
}
