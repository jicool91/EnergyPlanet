/**
 * Main Game Screen
 */

import { useEffect } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';

export function MainScreen() {
  const {
    energy,
    level,
    xp,
    passiveIncomePerSec,
    passiveIncomeMultiplier,
    streakCount,
    bestStreak,
    isCriticalStreak,
    lastTapAt,
    isLoading,
    tap,
    resetStreak,
  } = useGameStore();

  const handleTap = () => {
    tap(1);
  };

  useEffect(() => {
    if (streakCount === 0) {
      return;
    }

    const timer = setInterval(() => {
      if (!lastTapAt) {
        return;
      }
      if (Date.now() - lastTapAt > streakConfig.resetMs) {
        resetStreak();
      }
    }, 400);

    return () => clearInterval(timer);
  }, [streakCount, lastTapAt, resetStreak]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <p>Loading Energy Planet...</p>
      </div>
    );
  }

  return (
    <div className="main-screen">
      <div
        className={`streak-banner${streakCount > 0 ? ' active' : ''}${
          isCriticalStreak ? ' critical' : ''
        }`}
      >
        <span className="streak-label">Комбо</span>
        <span className="streak-count">{streakCount}</span>
        <span className="streak-best">Лучшее: {bestStreak}</span>
      </div>

      <header className="header">
        <div className="level">Level {level}</div>
        <div className="energy">{Math.floor(energy).toLocaleString()} E</div>
      </header>

      <div className="passive-panel">
        <div className="passive-stat">
          <span className="label">Пассивный доход</span>
          <strong>{passiveIncomePerSec.toFixed(1)} /с</strong>
        </div>
        <div className="passive-stat">
          <span className="label">Множитель</span>
          <strong>x{passiveIncomeMultiplier.toFixed(2)}</strong>
        </div>
        <div className="passive-stat">
          <span className="label">XP</span>
          <strong>{Math.floor(xp).toLocaleString()}</strong>
        </div>
      </div>

      <div className="planet-container" onClick={handleTap}>
        <div className={`planet${isCriticalStreak ? ' planet-critical' : ''}`}>
          <span>🌍</span>
        </div>
        <p className="tap-hint">Tap to generate energy!</p>
      </div>

      <footer className="footer">
        <button className="tab-button">🏠 Home</button>
        <button className="tab-button">🏗️ Buildings</button>
        <button className="tab-button">🏆 Leaderboard</button>
        <button className="tab-button">👤 Profile</button>
      </footer>
    </div>
  );
}
