import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { LeaderboardSkeleton, ErrorBoundary } from './skeletons';

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
        <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px]">
          <p className="m-0 mb-2">Не удалось получить рейтинг.</p>
          <small className="text-white/60">{leaderboardError}</small>
        </div>
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
      <div className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-lg">Топ игроков</h3>
        <span className="text-xs text-white/55">
          Всего игроков: {leaderboardTotal.toLocaleString()}
        </span>
      </div>
      <div className="rounded-lg overflow-hidden bg-dark-secondary/60 border border-cyan/[0.12] backdrop-blur-[6px]">
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
      </div>
      {userLeaderboardEntry &&
        !rows.some(entry => entry.user_id === userLeaderboardEntry.user_id) && (
          <div className="px-4 py-3 bg-cyan/[0.12] rounded-md flex gap-3 items-center justify-center">
            <span>Место</span>
            <strong>{userLeaderboardEntry.rank}</strong>
            <span>{userLeaderboardEntry.username || 'Вы'}</span>
          </div>
        )}
    </div>
  );
}
