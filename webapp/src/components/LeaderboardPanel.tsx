import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { LeaderboardSkeleton, ErrorBoundary } from './skeletons';
import { Card } from './Card';

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
            {rows.map(entry => (
              <tr
                key={entry.user_id}
                className={`border-b border-white/[0.04] hover:bg-cyan/[0.08] ${entry.user_id === userLeaderboardEntry?.user_id ? 'bg-cyan/[0.15]' : ''}`}
              >
                <td className="px-[14px] py-3 text-left">{entry.rank}</td>
                <td className="px-[14px] py-3 text-left">
                  <div className="flex flex-col gap-[2px]">
                    <span className="font-semibold">
                      {entry.username || entry.first_name || 'Игрок'}
                    </span>
                    <span className="text-[11px] text-white/40">#{entry.user_id.slice(0, 6)}</span>
                  </div>
                </td>
                <td className="px-[14px] py-3 text-left">{entry.level}</td>
                <td className="px-[14px] py-3 text-left">
                  {Math.floor(entry.total_energy_produced).toLocaleString()}
                </td>
              </tr>
            ))}
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
