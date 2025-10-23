/**
 * Main Game Screen
 */

import { useEffect, useMemo, useState } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';
import { ShopPanel } from '../components/ShopPanel';
import { BoostHub } from '../components/BoostHub';
import { BuildingsPanel } from '../components/BuildingsPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { ProfilePanel } from '../components/ProfilePanel';
import { SettingsScreen } from '../components/settings';
import { TapParticles } from '../components/animations';
import { ScreenTransition } from '../components/ScreenTransition';
import { useHaptic } from '../hooks/useHaptic';
import { StatCard } from '../components/StatCard';
import { formatCompactNumber, formatNumberWithSpaces } from '../utils/number';

type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';

const TAB_META: Record<
  TabKey,
  {
    title: string;
    description: string;
  }
> = {
  home: {
    title: 'Главная',
    description: 'Генерируйте энергию, отслеживайте прогресс и выбирайте следующую цель.',
  },
  shop: {
    title: 'Магазин',
    description: 'Покупайте пакеты Stars и косметику для персонализации планеты.',
  },
  boosts: {
    title: 'Boost Hub',
    description: 'Активируйте ежедневные и рекламные ускорители для пассива и тапа.',
  },
  builds: {
    title: 'Постройки',
    description: 'Инвестируйте энергию, чтобы усилить пассивный доход и открыть новые слоты.',
  },
  leaderboard: {
    title: 'Рейтинг',
    description: 'Сравните прогресс с друзьями и лидерами клана.',
  },
  profile: {
    title: 'Профиль',
    description: 'Настройте аватар, следите за статистикой и активными бустами.',
  },
  settings: {
    title: 'Настройки',
    description: 'Управляйте звуком, вибрацией, темой и языком приложения.',
  },
};

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

  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
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
      ? `${formatNumberWithSpaces(Math.max(0, xpIntoLevel))}/${formatNumberWithSpaces(
          Math.max(0, xpTotalForLevel)
        )} XP`
      : `${formatNumberWithSpaces(Math.max(0, Math.floor(xp)))} XP`;
  const passiveIncomeLabel =
    passiveIncomePerSec > 0
      ? `${
          passiveIncomePerSec >= 10
            ? Math.round(passiveIncomePerSec)
            : passiveIncomePerSec.toFixed(1)
        } E/с`
      : '—';
  const multiplierLabel =
    passiveIncomeMultiplier > 0
      ? `Множитель ×${passiveIncomeMultiplier.toFixed(2)}`
      : 'Активируйте буст';

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

  const renderNextGoal = () => {
    if (!purchaseInsight) {
      return null;
    }

    return (
      <div className="rounded-3xl bg-dark-secondary/60 border border-white/10 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-xs uppercase tracking-[0.6px] text-white/45">Следующая цель</p>
            <h3 className="m-0 text-lg text-white font-semibold">{purchaseInsight.name}</h3>
          </div>
          {purchaseInsight.roiRank && (
            <span className="text-xs text-lime/80 font-semibold">
              ROI #{purchaseInsight.roiRank}
            </span>
          )}
        </div>
        <div className="text-sm text-white/70">
          Стоимость: {formatNumberWithSpaces(Math.floor(purchaseInsight.cost))} E
        </div>
        <div className="text-sm text-white/60">
          {purchaseInsight.affordable
            ? 'Доступно прямо сейчас — подсказка в разделе Постройки.'
            : `Осталось накопить ${formatNumberWithSpaces(Math.floor(purchaseInsight.remaining))} E`}
        </div>
        {purchaseInsight.paybackSeconds && (
          <div className="text-xs text-white/45">
            Окупаемость ≈ {Math.round(purchaseInsight.paybackSeconds)} секунд
          </div>
        )}
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScreenTransition key="home" type="fade" className="flex flex-col gap-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#0c1433] via-[#0b1a42] to-[#0b1429] border border-white/10 shadow-[0_24px_60px_rgba(8,12,36,0.45)] overflow-hidden">
              <div className="px-5 pt-5 pb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="m-0 text-xs uppercase tracking-[0.6px] text-white/45">
                    Главный источник
                  </p>
                  <h3 className="m-0 text-xl font-semibold text-white">Генерируйте энергию</h3>
                  <p className="mt-1 text-sm text-white/60">
                    Каждый тап усиливает планету и открывает доступ к новым постройкам.
                  </p>
                </div>
                <div className="hidden sm:block text-4xl" aria-hidden>
                  ✨
                </div>
              </div>
              <div className="p-6 pt-0">
                <TapParticles onTap={handleTap}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`text-[120px] transition-transform duration-150 user-select-none active:scale-95 ${
                        isCriticalStreak ? 'animate-pulse' : ''
                      }`}
                    >
                      🌍
                    </div>
                    <p className="mt-5 text-base text-white/70">
                      Тапните, чтобы произвести энергию
                    </p>
                  </div>
                </TapParticles>
              </div>
            </div>
            {renderNextGoal()}
          </ScreenTransition>
        );
      case 'shop':
        return (
          <ScreenTransition key="shop" type="slide" className="flex-1 overflow-auto">
            <ShopPanel />
          </ScreenTransition>
        );
      case 'boosts':
        return (
          <ScreenTransition key="boosts" type="slide" className="flex-1 overflow-auto">
            <BoostHub />
          </ScreenTransition>
        );
      case 'builds':
        return (
          <ScreenTransition key="builds" type="slide" className="flex-1 overflow-auto">
            <BuildingsPanel />
          </ScreenTransition>
        );
      case 'leaderboard':
        return (
          <ScreenTransition key="leaderboard" type="slide" className="flex-1 overflow-auto">
            <LeaderboardPanel />
          </ScreenTransition>
        );
      case 'profile':
        return (
          <ScreenTransition key="profile" type="slide" className="flex-1 overflow-auto">
            <ProfilePanel />
          </ScreenTransition>
        );
      case 'settings':
        return (
          <ScreenTransition key="settings" type="slide" className="flex-1 overflow-auto">
            <SettingsScreen onClose={() => setActiveTab('home')} />
          </ScreenTransition>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden">
      <div
        className="flex flex-col gap-5 overflow-y-auto flex-1 min-h-0 px-5"
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'calc(60px + var(--safe-area-bottom))',
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon="⚡"
            label="Энергия"
            value={`${energyCompact} E`}
            subLabel={`≈ ${energyFull} E`}
          />
          <StatCard
            icon="🎯"
            label="Прогресс уровня"
            value={`${Math.round(xpProgress * 100)}%`}
            subLabel={
              xpRemaining > 0
                ? `Осталось ${formatNumberWithSpaces(Math.max(0, xpRemaining))} XP`
                : 'Уровень готов к апгрейду'
            }
          />
          <StatCard
            icon="🪐"
            label="Tap lvl"
            value={`Lv ${tapLevel}`}
            subLabel={`${tapIncomeDisplay} E/тап`}
          />
          <StatCard
            icon="💤"
            label="Пассивный доход"
            value={passiveIncomeLabel}
            subLabel={multiplierLabel}
          />
        </div>

        {streakCount > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <StatCard
              icon="🔥"
              label="Комбо"
              value={`×${streakCount}`}
              subLabel={`Лучшее: ${bestStreak}`}
              tone={isCriticalStreak ? 'positive' : 'default'}
            />
          </div>
        )}

        <div className="rounded-3xl bg-dark-secondary/60 border border-white/10 p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="m-0 text-xs uppercase tracking-[0.6px] text-white/45">
                Прогресс уровня
              </p>
              <h3 className="m-0 text-lg font-semibold text-white">Уровень {level}</h3>
            </div>
            <span className="text-sm text-white/60">{xpProgressLabel}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan via-lime to-gold transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, xpProgress * 100))}%` }}
            />
          </div>
          <div className="text-xs text-white/60">
            {xpRemaining > 0
              ? `Осталось ${formatNumberWithSpaces(Math.max(0, xpRemaining))} XP`
              : 'Уровень готов к апгрейду — загляните в Постройки или Boost Hub'}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h2 className="m-0 text-xl font-semibold text-white">{TAB_META[activeTab].title}</h2>
            <p className="m-0 text-sm text-white/60">{TAB_META[activeTab].description}</p>
          </div>
          {renderActiveTab()}
        </div>
      </div>

      <footer
        className="fixed bottom-0 left-0 right-0 flex justify-around p-2.5 bg-black/85 border-t border-white/10 z-[100] w-full backdrop-blur"
        style={{
          paddingBottom: 'var(--safe-area-bottom)',
          paddingLeft: 'var(--safe-area-left)',
          paddingRight: 'var(--safe-area-right)',
        }}
      >
        {Object.entries(TAB_META).map(([key, meta]) => {
          const tab = key as TabKey;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              className={`flex-1 flex flex-col gap-1 items-center bg-none border-none text-sm py-2 px-2 cursor-pointer transition-colors ${
                active ? 'text-cyan font-semibold' : 'text-white/60 hover:text-cyan'
              }`}
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              <span className="text-lg" aria-hidden="true">
                {tab === 'home'
                  ? '🏠'
                  : tab === 'shop'
                    ? '🛍️'
                    : tab === 'boosts'
                      ? '🚀'
                      : tab === 'builds'
                        ? '🏗️'
                        : tab === 'leaderboard'
                          ? '🏆'
                          : tab === 'profile'
                            ? '👤'
                            : '⚙️'}
              </span>
              <span className="text-xs">{meta.title}</span>
            </button>
          );
        })}
      </footer>
    </div>
  );
}
