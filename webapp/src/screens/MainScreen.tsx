/**
 * Main Game Screen
 */

import { useEffect, useState, useMemo } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';
import { ShopPanel } from '../components/ShopPanel';
import { BoostHub } from '../components/BoostHub';
import { BuildingsPanel } from '../components/BuildingsPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { ProfilePanel } from '../components/ProfilePanel';
import { TapParticles } from '../components/animations';
import { AnimatedNumber } from '../components/AnimatedNumber';

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
    loadLeaderboard,
    loadProfile,
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const handleTap = () => {
    tap(1);
  };

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
    <div className="flex flex-col w-full h-full relative overflow-hidden">
      <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 px-5" style={{ paddingTop: 'var(--safe-area-top)', paddingBottom: 'calc(60px + var(--safe-area-bottom))' }}>
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
          <div className="flex items-center gap-1">
            <AnimatedNumber
              value={Math.floor(energy)}
              className="text-2xl font-bold text-cyan"
              duration={300}
            />
            <span className="text-2xl font-bold text-cyan">E</span>
          </div>
        </header>

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
          <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
            <TapParticles onTap={handleTap}>
              <div className="flex flex-col items-center">
                <div className={`text-[120px] transition-transform duration-100 user-select-none active:scale-95 ${isCriticalStreak ? 'animate-pulse' : ''}`}>
                  🌍
                </div>
                <p className="mt-5 text-base text-white/60">Tap to generate energy!</p>
              </div>
            </TapParticles>
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
      <footer className="fixed bottom-0 left-0 right-0 flex justify-around p-2.5 bg-black/80 border-t border-white/10 z-[100] w-full" style={{ paddingBottom: 'var(--safe-area-bottom)', paddingLeft: 'var(--safe-area-left)', paddingRight: 'var(--safe-area-right)' }}>
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
