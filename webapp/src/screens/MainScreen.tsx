/**
 * Main Game Screen
 */

import { useEffect, useMemo, Suspense, lazy } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';
import { HomePanel } from '../components/HomePanel';
import { ScreenTransition, ShopSkeleton, BuildingSkeleton, LeaderboardSkeleton, ProfileSkeleton } from '../components';
import { useHaptic } from '../hooks/useHaptic';

// Lazy load heavy components
const ShopPanel = lazy(() => import('../components/ShopPanel').then(m => ({ default: m.ShopPanel })));
const BoostHub = lazy(() => import('../components/BoostHub').then(m => ({ default: m.BoostHub })));
const BuildingsPanel = lazy(() => import('../components/BuildingsPanel').then(m => ({ default: m.BuildingsPanel })));
const LeaderboardPanel = lazy(() => import('../components/LeaderboardPanel').then(m => ({ default: m.LeaderboardPanel })));
const ProfilePanel = lazy(() => import('../components/ProfilePanel').then(m => ({ default: m.ProfilePanel })));
const SettingsScreen = lazy(() => import('../components/settings').then(m => ({ default: m.SettingsScreen })));

type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';

interface MainScreenProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const TAB_META: Record<
  Exclude<TabKey, 'home'>,
  {
    title: string;
    description: string;
  }
> = {
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

export function MainScreen({ activeTab, onTabChange }: MainScreenProps) {
  const {
    energy,
    level,
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

  const handleTap = () => {
    tap(1);
    hapticTap();
  };

  const tapIncomeDisplay = useMemo(
    () => Math.max(0, tapIncome).toLocaleString('ru-RU'),
    [tapIncome]
  );
  const xpTotalForLevel = xpIntoLevel + xpToNextLevel;
  const xpProgress = xpTotalForLevel > 0 ? Math.min(1, xpIntoLevel / xpTotalForLevel) : 0;
  const xpRemaining = xpToNextLevel;
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScreenTransition key="home" type="fade">
            <HomePanel
              energy={energy}
              level={level}
              xpProgress={xpProgress}
              xpIntoLevel={xpIntoLevel}
              xpToNextLevel={xpToNextLevel}
              xpRemaining={xpRemaining}
              tapLevel={tapLevel}
              tapIncomeDisplay={tapIncomeDisplay}
              passiveIncomeLabel={passiveIncomeLabel}
              multiplierLabel={multiplierLabel}
              streakCount={streakCount}
              bestStreak={bestStreak}
              isCriticalStreak={isCriticalStreak}
              purchaseInsight={purchaseInsight || undefined}
              onTap={handleTap}
            />
          </ScreenTransition>
        );
      case 'shop':
        return (
          <ScreenTransition key="shop" type="slide" className="flex-1 overflow-auto">
            <Suspense fallback={<ShopSkeleton />}>
              <ShopPanel />
            </Suspense>
          </ScreenTransition>
        );
      case 'boosts':
        return (
          <ScreenTransition key="boosts" type="slide" className="flex-1 overflow-auto">
            <Suspense fallback={<ShopSkeleton />}>
              <BoostHub />
            </Suspense>
          </ScreenTransition>
        );
      case 'builds':
        return (
          <ScreenTransition key="builds" type="slide" className="flex-1 overflow-auto">
            <Suspense fallback={<BuildingSkeleton />}>
              <BuildingsPanel />
            </Suspense>
          </ScreenTransition>
        );
      case 'leaderboard':
        return (
          <ScreenTransition key="leaderboard" type="slide" className="flex-1 overflow-auto">
            <Suspense fallback={<LeaderboardSkeleton />}>
              <LeaderboardPanel />
            </Suspense>
          </ScreenTransition>
        );
      case 'profile':
        return (
          <ScreenTransition key="profile" type="slide" className="flex-1 overflow-auto">
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfilePanel />
            </Suspense>
          </ScreenTransition>
        );
      case 'settings':
        return (
          <ScreenTransition key="settings" type="slide" className="flex-1 overflow-auto">
            <Suspense fallback={<div className="p-4">Загрузка...</div>}>
              <SettingsScreen onClose={() => onTabChange('home')} />
            </Suspense>
          </ScreenTransition>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative overflow-hidden">
      <div
        className="flex flex-col overflow-y-auto flex-1 min-h-0"
        style={{
          paddingTop: 'var(--safe-area-top)',
          paddingBottom: 'calc(60px + var(--safe-area-bottom))',
        }}
      >
        {activeTab === 'home' ? (
          renderActiveTab()
        ) : (
          <div className="flex flex-col gap-3 p-4">
            <div>
              <h2 className="m-0 text-xl font-semibold text-white">{TAB_META[activeTab].title}</h2>
              <p className="m-0 text-sm text-white/60">{TAB_META[activeTab].description}</p>
            </div>
            {renderActiveTab()}
          </div>
        )}
      </div>
    </div>
  );
}
