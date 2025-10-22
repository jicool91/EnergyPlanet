/**
 * Main Game Screen
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';
import { ShopPanel } from '../components/ShopPanel';
import { BoostHub } from '../components/BoostHub';
import { BuildingsPanel } from '../components/BuildingsPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { ProfilePanel } from '../components/ProfilePanel';

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
    loadProfile,
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

  useEffect(() => {
    if (activeTab === 'profile') {
      loadProfile();
    }
  }, [activeTab, loadProfile]);

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
      <div className="flex items-center justify-center w-full h-full min-h-screen text-lg">
        <p>Loading Energy Planet...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[1fr_auto] grid-cols-1 w-full h-full relative">
      <div className="flex flex-col gap-4 overflow-hidden min-h-0 px-5 pt-3 grid-col-1 grid-row-1">
        {/* Комбо бaнер */}
        <div className={`transition-all duration-200 ${
          streakCount > 0
            ? 'absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-lime/20 border border-lime text-lime text-sm font-semibold'
            : 'absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-transparent border-0'
        } ${isCriticalStreak ? 'animate-pulse' : ''}`}>
          {streakCount > 0 && (
            <>
              <span>🔥 Комбо: {streakCount} </span>
              <span className="text-xs opacity-80">(Лучшее: {bestStreak})</span>
            </>
          )}
        </div>

        {/* Заголовок с уровнем и энергией */}
        <header className="px-5 flex justify-between items-center bg-black/50 py-3 rounded-lg">
          <div className="text-base font-bold text-gold">Level {level}</div>
          <div className="text-2xl font-bold text-cyan">{Math.floor(energy).toLocaleString()} E</div>
        </header>

        {/* Статус сессии */}
        <div className="mx-2 my-2 p-4 rounded-2xl bg-blue-900/70 border border-cyan/20 flex items-center justify-between gap-4 backdrop-blur">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-white/45">Снапшот</span>
            <span className="text-sm font-semibold text-white">{formatLastSync(sessionLastSyncedAt)}</span>
            {sessionErrorMessage && (
              <span className="text-xs text-orange">{truncateMessage(sessionErrorMessage)}</span>
            )}
          </div>
          <button
            className="px-3 py-2 rounded-2xl bg-gradient-to-r from-cyan/20 to-blue-500/35 text-white text-xs font-semibold cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-default disabled:shadow-none"
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Обновление…' : 'Обновить'}
          </button>
        </div>

        {/* Пассивный доход статистика */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span className="text-xs text-white/60">Пассивный доход</span>
            <strong className="text-sm text-white">{passiveIncomePerSec > 0 ? `${passiveIncomePerSec.toFixed(1)} /с` : '—'}</strong>
          </div>
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span className="text-xs text-white/60">Множитель</span>
            <strong className="text-sm text-white">{passiveIncomeMultiplier > 0 ? `x${passiveIncomeMultiplier.toFixed(2)}` : '—'}</strong>
          </div>
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span className="text-xs text-white/60">XP</span>
            <strong className="text-sm text-white">{xp > 0 ? Math.floor(xp).toLocaleString() : '—'}</strong>
          </div>
        </div>

        {/* Планета (таб Home) */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-center cursor-pointer min-h-0 overflow-hidden" onClick={handleTap}>
            <div className={`text-[120px] transition-transform duration-100 user-select-none active:scale-95 ${isCriticalStreak ? 'animate-pulse' : ''}`}>
              🌍
            </div>
            <p className="mt-5 text-base text-white/60">Tap to generate energy!</p>
          </div>
        )}

        {/* Магазин */}
        {activeTab === 'shop' && (
          <div className="flex-1 overflow-auto">
            <ShopPanel />
          </div>
        )}

        {/* Boost Hub */}
        {activeTab === 'boosts' && (
          <div className="flex-1 overflow-auto">
            <BoostHub />
          </div>
        )}

        {/* Постройки */}
        {activeTab === 'builds' && (
          <div className="flex-1 overflow-auto">
            <BuildingsPanel />
          </div>
        )}

        {/* Рейтинг */}
        {activeTab === 'leaderboard' && (
          <div className="flex-1 overflow-auto">
            <LeaderboardPanel />
          </div>
        )}

        {/* Профиль */}
        {activeTab === 'profile' && (
          <div className="flex-1 overflow-auto">
            <ProfilePanel />
          </div>
        )}
      </div>

      {/* Footer с навигацией */}
      <footer className="flex justify-around p-2.5 bg-black/80 border-t border-white/10 grid-col-1 grid-row-2 z-100" style={{ paddingBottom: 'calc(10px + var(--tg-safe-area-bottom, 0px))' }}>
        {tabButtons.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 flex flex-col gap-1 items-center bg-none border-none text-sm py-2.5 px-2.5 cursor-pointer transition-colors ${
              activeTab === tab.key
                ? 'text-cyan font-semibold'
                : 'text-white/60 hover:text-cyan active:text-cyan'
            }`}
            type="button"
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="text-lg" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </footer>
    </div>
  );
}
