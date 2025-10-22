/**
 * Main Game Screen
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';
import { ShopPanel } from '../components/ShopPanel';
import { BoostHub } from '../components/BoostHub';
import { BuildingsPanel } from '../components/BuildingsPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';

function formatLastSync(timestamp: number | null): string {
  if (!timestamp) {
    return 'ещё нет данных';
  }

  const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

  if (diffSeconds < 5) {
    return 'только что';
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}с назад`;
  }

  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} мин назад`;
  }

  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function truncateMessage(message: string, maxLength = 140): string {
  if (message.length <= maxLength) {
    return message;
  }
  return `${message.slice(0, maxLength - 1)}…`;
}

type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile';

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
    sessionLastSyncedAt,
    sessionErrorMessage,
    refreshSession,
    loadLeaderboard,
  } = useGameStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const handleTap = () => {
    tap(1);
  };

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }
    setIsRefreshing(true);
    try {
      await refreshSession();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshSession]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    }
  }, [activeTab, loadLeaderboard]);

  const tabButtons: { key: TabKey; label: string; icon: string }[] = useMemo(
    () => [
      { key: 'home', label: 'Главная', icon: '🏠' },
      { key: 'shop', label: 'Магазин', icon: '🛍️' },
      { key: 'boosts', label: 'Boost Hub', icon: '🚀' },
      { key: 'builds', label: 'Постройки', icon: '🏗️' },
      { key: 'leaderboard', label: 'Рейтинг', icon: '🏆' },
      { key: 'profile', label: 'Профиль', icon: '👤' },
    ],
    []
  );

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

      <div className="session-status">
        <div className="status-text">
          <span className="status-label">Снапшот</span>
          <span className="status-value">{formatLastSync(sessionLastSyncedAt)}</span>
          {sessionErrorMessage && (
            <span className="status-error">{truncateMessage(sessionErrorMessage)}</span>
          )}
        </div>
        <button
          className="status-refresh"
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Обновление…' : 'Обновить'}
        </button>
      </div>

      <div className="passive-panel">
        <div className="passive-stat">
          <span className="label">Пассивный доход</span>
          <strong>{passiveIncomePerSec > 0 ? `${passiveIncomePerSec.toFixed(1)} /с` : '—'}</strong>
        </div>
        <div className="passive-stat">
          <span className="label">Множитель</span>
          <strong>{passiveIncomeMultiplier > 0 ? `x${passiveIncomeMultiplier.toFixed(2)}` : '—'}</strong>
        </div>
        <div className="passive-stat">
          <span className="label">XP</span>
          <strong>{xp > 0 ? Math.floor(xp).toLocaleString() : '—'}</strong>
        </div>
      </div>

      {activeTab === 'home' && (
        <div className="planet-container" onClick={handleTap}>
          <div className={`planet${isCriticalStreak ? ' planet-critical' : ''}`}>
            <span>🌍</span>
          </div>
          <p className="tap-hint">Tap to generate energy!</p>
        </div>
      )}

      {activeTab === 'shop' && (
        <div className="tab-content">
          <ShopPanel />
        </div>
      )}

      {activeTab === 'boosts' && (
        <div className="tab-content">
          <BoostHub />
        </div>
      )}

      {activeTab === 'builds' && (
        <div className="tab-content">
          <BuildingsPanel />
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="tab-content">
          <LeaderboardPanel />
        </div>
      )}

      {activeTab !== 'home' && activeTab !== 'shop' && activeTab !== 'boosts' && activeTab !== 'builds' && (
        <div className="tab-content soon">
          <div className="coming-soon">Раздел в разработке</div>
        </div>
      )}

      <footer className="footer">
        {tabButtons.map(tab => (
          <button
            key={tab.key}
            className={`tab-button${activeTab === tab.key ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </footer>
    </div>
  );
}
