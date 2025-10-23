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
import { SettingsScreen } from '../components/settings';
import { TapParticles } from '../components/animations';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ScreenTransition } from '../components/ScreenTransition';
import { useHaptic } from '../hooks/useHaptic';
import { formatCompactNumber, formatNumberWithSpaces, formatDelta } from '../utils/number';

type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';

export function MainScreen() {
  const {
    energy,
    level,
    xp,
    xpIntoLevel,
    xpToNextLevel,
    tapLevel,
    tapIncome,
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
    buildingCatalog,
    buildings,
  } = useGameStore();

  const { tap: hapticTap } = useHaptic();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const handleTap = () => {
    tap(1);
    hapticTap();
  };

  const energyFull = useMemo(() => formatNumberWithSpaces(Math.floor(energy)), [energy]);
  const tapIncomeDisplay = useMemo(
    () => Math.max(0, tapIncome).toLocaleString('ru-RU'),
    [tapIncome]
  );
  const xpTotalForLevel = xpIntoLevel + xpToNextLevel;
  const xpProgress = xpTotalForLevel > 0 ? Math.min(1, xpIntoLevel / xpTotalForLevel) : 0;
  const xpRemaining = xpToNextLevel;
  const xpProgressLabel =
    xpTotalForLevel > 0
      ? `${formatNumberWithSpaces(Math.max(0, xpIntoLevel))}/${formatNumberWithSpaces(Math.max(0, xpTotalForLevel))} XP`
      : `${formatNumberWithSpaces(Math.max(0, Math.floor(xp)))} XP`;
  const purchaseInsight = useMemo(() => {
    if (!Array.isArray(buildingCatalog) || buildingCatalog.length === 0) {
      return null;
    }

    const merged = buildingCatalog.map(def => {
      const owned = buildings.find(b => b.buildingId === def.id);
      const count = owned?.count ?? 0;
      const levelOwned = owned?.level ?? 0;
      const incomePerSec = owned?.incomePerSec ?? def.base_income ?? 0;
      const nextCost = owned?.nextCost ?? def.base_cost ?? 0;
      const paybackSeconds =
        def.payback_seconds ?? (incomePerSec > 0 ? nextCost / incomePerSec : null);

      return {
        ...def,
        count,
        levelOwned,
        incomePerSec,
        nextCost,
        paybackSeconds,
      };
    });

    const unlocked = merged.filter(entry => {
      if (entry.unlock_level == null) {
        return true;
      }
      return level >= entry.unlock_level;
    });

    if (unlocked.length === 0) {
      return null;
    }

    const affordableNow = unlocked
      .filter(entry => entry.nextCost > 0 && energy >= entry.nextCost)
      .sort((a, b) => {
        const rankA = a.roi_rank ?? Number.POSITIVE_INFINITY;
        const rankB = b.roi_rank ?? Number.POSITIVE_INFINITY;
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return (
          (a.paybackSeconds ?? Number.POSITIVE_INFINITY) -
          (b.paybackSeconds ?? Number.POSITIVE_INFINITY)
        );
      });

    const cheapestUnlocked = [...unlocked].sort(
      (a, b) => (a.nextCost ?? Number.POSITIVE_INFINITY) - (b.nextCost ?? Number.POSITIVE_INFINITY)
    );

    const target = affordableNow[0] ?? cheapestUnlocked[0];
    if (!target || !target.nextCost || target.nextCost <= 0) {
      return null;
    }

    const baseIncome = target.base_income ?? 0;
    const incomeGain = baseIncome > 0 ? baseIncome : 0;
    const remaining = Math.max(0, target.nextCost - energy);

    return {
      name: target.name,
      cost: target.nextCost,
      affordable: energy >= target.nextCost,
      remaining,
      roiRank: target.roi_rank ?? null,
      paybackSeconds: target.paybackSeconds,
      incomeGain,
    };
  }, [buildingCatalog, buildings, level, energy]);

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
      { key: 'settings', label: 'Настройки', icon: '⚙️' },
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
      <div
        className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 px-5"
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'calc(60px + var(--safe-area-bottom))',
        }}
      >
        {/* Комбо бaнер */}
        <div
          className={`transition-all duration-200 ${
            streakCount > 0
              ? 'absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-lime/20 border border-lime text-lime text-sm font-semibold'
              : 'absolute top-2 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-transparent border-0'
          } ${isCriticalStreak ? 'animate-pulse' : ''}`}
        >
          {streakCount > 0 && (
            <>
              <span>🔥 Комбо: {streakCount} </span>
              <span className="text-xs opacity-80">(Лучшее: {bestStreak})</span>
            </>
          )}
        </div>

        {/* Заголовок с уровнем и энергией */}
        <header className="px-5 flex justify-between items-start gap-4 bg-black/50 py-3 rounded-lg">
          <div className="flex flex-col gap-1">
            <div className="text-base font-bold text-gold">Уровень {level}</div>
            <span
              className="text-xs text-white/60"
              title="Уровень тапа повышает энергию за одно нажатие и ускоряет прогресс."
            >
              Тап lvl {tapLevel} · {tapIncomeDisplay} E/тап
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-baseline gap-1">
              <AnimatedNumber
                value={Math.floor(energy)}
                className="text-2xl font-bold text-cyan"
                duration={300}
                showDelta
                formatter={formatCompactNumber}
                deltaFormatter={formatDelta}
              />
              <span className="text-xl font-semibold text-cyan">E</span>
            </div>
            <span className="text-[11px] text-white/45">{energyFull} E</span>
          </div>
        </header>

        {/* Пассивный доход статистика */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span
              className="text-xs text-white/60"
              title="Пассивная энергия поступает каждую секунду от построек и бустов."
            >
              Пассивный доход
            </span>
            <strong className="text-sm text-white">
              {passiveIncomePerSec > 0 ? `${passiveIncomePerSec.toFixed(1)} E/с` : '—'}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span
              className="text-xs text-white/60"
              title="Множитель учитывает активные бусты и бонусы."
            >
              Множитель
            </span>
            <strong className="text-sm text-white">
              {passiveIncomeMultiplier > 0 ? `×${passiveIncomeMultiplier.toFixed(2)}` : '—'}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span
              className="text-xs text-white/60"
              title="XP открывает новые постройки, бусты и сезонные награды."
            >
              XP
            </span>
            <strong className="text-sm text-white">
              {xp > 0 ? formatNumberWithSpaces(Math.floor(xp)) : '—'}
            </strong>
            <span className="text-[11px] text-white/45">
              До уровня: {formatNumberWithSpaces(Math.max(0, xpRemaining))} XP
            </span>
          </div>
          <div className="p-3 rounded-lg bg-dark-secondary/50 border border-cyan/10 flex flex-col gap-1">
            <span
              className="text-xs text-white/60"
              title="Повышайте Tap lvl в бустах и магазине, чтобы получать больше энергии за одно нажатие."
            >
              Tap lvl
            </span>
            <strong className="text-sm text-white">{tapLevel}</strong>
            <span className="text-[11px] text-white/45">{tapIncomeDisplay} E/тап</span>
          </div>
        </div>

        {/* Прогресс уровня */}
        <div
          className="p-3 rounded-lg bg-dark-secondary/60 border border-cyan/10 flex flex-col gap-2"
          title="Следите за прогрессом, чтобы вовремя заходить в магазин и постройки."
        >
          <div className="flex justify-between text-[11px] text-white/50 uppercase tracking-[0.6px]">
            <span>Прогресс уровня</span>
            <span>{xpProgressLabel}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan via-lime to-gold transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, xpProgress * 100))}%` }}
            />
          </div>
          <div className="text-[11px] text-white/60">
            {xpRemaining > 0
              ? `Осталось ${formatNumberWithSpaces(Math.max(0, xpRemaining))} XP до следующего уровня`
              : 'Уровень готов к апгрейду — загляните в постройки и бусты'}
          </div>
        </div>

        {purchaseInsight && (
          <div className="p-3 rounded-lg bg-[rgba(10,14,32,0.9)] border border-cyan/15 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase text-white/45 tracking-[0.6px]">
                Следующая цель
              </span>
              {purchaseInsight.roiRank && (
                <span className="text-[11px] text-lime/80 font-semibold">
                  ROI #{purchaseInsight.roiRank}
                </span>
              )}
            </div>
            <div className="text-sm text-white font-semibold">{purchaseInsight.name}</div>
            <div className="text-xs text-white/70">
              {purchaseInsight.affordable
                ? `Доступно сейчас за ${formatNumberWithSpaces(Math.floor(purchaseInsight.cost))} E`
                : `Осталось ${formatNumberWithSpaces(Math.floor(purchaseInsight.remaining))} E · Стоимость ${formatNumberWithSpaces(Math.floor(purchaseInsight.cost))} E`}
            </div>
            {purchaseInsight.paybackSeconds && (
              <div className="text-[11px] text-white/40">
                Окупаемость ≈ {Math.round(purchaseInsight.paybackSeconds)} с
              </div>
            )}
            {purchaseInsight.incomeGain > 0 && (
              <div className="text-[11px] text-white/50">
                После покупки: +{formatNumberWithSpaces(Math.floor(purchaseInsight.incomeGain))} E/с
              </div>
            )}
          </div>
        )}

        {/* Планета (таб Home) */}
        {activeTab === 'home' && (
          <ScreenTransition
            key="home"
            type="fade"
            className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden"
          >
            <TapParticles onTap={handleTap}>
              <div className="flex flex-col items-center">
                <div
                  className={`text-[120px] transition-transform duration-100 user-select-none active:scale-95 ${isCriticalStreak ? 'animate-pulse' : ''}`}
                >
                  🌍
                </div>
                <p className="mt-5 text-base text-white/60">Tap to generate energy!</p>
              </div>
            </TapParticles>
          </ScreenTransition>
        )}

        {/* Магазин */}
        {activeTab === 'shop' && (
          <ScreenTransition key="shop" type="slide" className="flex-1 overflow-auto">
            <ShopPanel />
          </ScreenTransition>
        )}

        {/* Boost Hub */}
        {activeTab === 'boosts' && (
          <ScreenTransition key="boosts" type="slide" className="flex-1 overflow-auto">
            <BoostHub />
          </ScreenTransition>
        )}

        {/* Постройки */}
        {activeTab === 'builds' && (
          <ScreenTransition key="builds" type="slide" className="flex-1 overflow-auto">
            <BuildingsPanel />
          </ScreenTransition>
        )}

        {/* Рейтинг */}
        {activeTab === 'leaderboard' && (
          <ScreenTransition key="leaderboard" type="slide" className="flex-1 overflow-auto">
            <LeaderboardPanel />
          </ScreenTransition>
        )}

        {/* Профиль */}
        {activeTab === 'profile' && (
          <ScreenTransition key="profile" type="slide" className="flex-1 overflow-auto">
            <ProfilePanel />
          </ScreenTransition>
        )}

        {/* Настройки */}
        {activeTab === 'settings' && (
          <ScreenTransition key="settings" type="slide" className="flex-1 overflow-auto">
            <SettingsScreen onClose={() => setActiveTab('home')} />
          </ScreenTransition>
        )}
      </div>

      {/* Footer с навигацией */}
      <footer
        className="fixed bottom-0 left-0 right-0 flex justify-around p-2.5 bg-black/80 border-t border-white/10 z-[100] w-full"
        style={{
          paddingBottom: 'var(--safe-area-bottom)',
          paddingLeft: 'var(--safe-area-left)',
          paddingRight: 'var(--safe-area-right)',
        }}
      >
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
