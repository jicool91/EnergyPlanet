import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

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
      <div className="leaderboard-panel loading">
        <p>Загружаем таблицу лидеров…</p>
      </div>
    );
  }

  if (leaderboardError) {
    return (
      <div className="leaderboard-panel error">
        <p>Не удалось получить рейтинг.</p>
        <small>{leaderboardError}</small>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="leaderboard-panel empty">
        <p>Ещё никто не попал в рейтинг. Будь первым!</p>
      </div>
    );
  }

  return (
    <div className="leaderboard-panel">
      <div className="leaderboard-header">
        <h3>Топ игроков</h3>
        <span className="total">Всего игроков: {leaderboardTotal.toLocaleString()}</span>
      </div>
      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Игрок</th>
              <th>Уровень</th>
              <th>Энергия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(entry => (
              <tr
                key={entry.user_id}
                className={entry.user_id === userLeaderboardEntry?.user_id ? 'viewer' : undefined}
              >
                <td>{entry.rank}</td>
                <td>
                  <div className="player-id">
                    <span className="name">{entry.username || entry.first_name || 'Игрок'}</span>
                    <span className="tag">#{entry.user_id.slice(0, 6)}</span>
                  </div>
                </td>
                <td>{entry.level}</td>
                <td>{Math.floor(entry.total_energy_produced).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {userLeaderboardEntry && !rows.some(entry => entry.user_id === userLeaderboardEntry.user_id) && (
        <div className="leaderboard-viewer-rank">
          <span>Место</span>
          <strong>{userLeaderboardEntry.rank}</strong>
          <span>{(userLeaderboardEntry.username || 'Вы')}</span>
        </div>
      )}
    </div>
  );
}
