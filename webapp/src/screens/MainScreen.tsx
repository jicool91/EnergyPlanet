/**
 * Main Game Screen
 */

import { useEffect, useMemo, Suspense, lazy, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { streakConfig, useGameStore } from '../store/gameStore';
import { HomePanel } from '../components/HomePanel';
import {
  ScreenTransition,
  ShopSkeleton,
  BuildingSkeleton,
  LeaderboardSkeleton,
  ProfileSkeleton,
} from '../components';
import { useHaptic } from '../hooks/useHaptic';
import { useScrollToTop } from '../hooks/useScrollToTop';
import { useNotification } from '../hooks/useNotification';
import { useSafeArea } from '../hooks';
import { shallow } from 'zustand/shallow';
import { useCatalogStore } from '../store/catalogStore';
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext';

const TAB_BAR_RESERVE_PX = 88;

// Lazy load heavy components
const ShopPanel = lazy(() =>
  import('../components/ShopPanel').then(m => ({ default: m.ShopPanel }))
);
const BoostHub = lazy(() => import('../components/BoostHub').then(m => ({ default: m.BoostHub })));
const BuildingsPanel = lazy(() =>
  import('../components/BuildingsPanel').then(m => ({ default: m.BuildingsPanel }))
);
const LeaderboardPanel = lazy(() =>
  import('../components/LeaderboardPanel').then(m => ({ default: m.LeaderboardPanel }))
);
const ProfilePanel = lazy(() =>
  import('../components/ProfilePanel').then(m => ({ default: m.ProfilePanel }))
);
const SettingsScreen = lazy(() =>
  import('../components/settings').then(m => ({ default: m.SettingsScreen }))
);

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
    boostMultiplier,
    prestigeMultiplier,
    prestigeLevel,
    prestigeEnergySinceReset,
    prestigeNextThreshold,
    prestigeEnergyToNext,
    prestigeGainAvailable,
    isPrestigeAvailable,
    isPrestigeLoading,
    streakCount,
    bestStreak,
    isCriticalStreak,
    lastTapAt,
    isLoading,
    buildings,
  } = useGameStore(
    state => ({
      energy: state.energy,
      level: state.level,
      xpIntoLevel: state.xpIntoLevel,
      xpToNextLevel: state.xpToNextLevel,
      tapLevel: state.tapLevel,
      tapIncome: state.tapIncome,
      passiveIncomePerSec: state.passiveIncomePerSec,
      boostMultiplier: state.boostMultiplier,
      prestigeMultiplier: state.prestigeMultiplier,
      prestigeLevel: state.prestigeLevel,
      prestigeEnergySinceReset: state.prestigeEnergySinceReset,
      prestigeNextThreshold: state.prestigeNextThreshold,
      prestigeEnergyToNext: state.prestigeEnergyToNext,
      prestigeGainAvailable: state.prestigeGainAvailable,
      isPrestigeAvailable: state.isPrestigeAvailable,
      isPrestigeLoading: state.isPrestigeLoading,
      streakCount: state.streakCount,
      bestStreak: state.bestStreak,
      isCriticalStreak: state.isCriticalStreak,
      lastTapAt: state.lastTapAt,
      isLoading: state.isLoading,
      buildings: state.buildings,
    }),
    shallow
  );
  const { tap, resetStreak, loadLeaderboard, loadProfile, loadPrestigeStatus, performPrestige } =
    useGameStore(
    state => ({
      tap: state.tap,
      resetStreak: state.resetStreak,
      loadLeaderboard: state.loadLeaderboard,
      loadProfile: state.loadProfile,
      loadPrestigeStatus: state.loadPrestigeStatus,
      performPrestige: state.performPrestige,
    }),
    shallow
  );
  const { buildingCatalog } = useCatalogStore(
    state => ({
      buildingCatalog: state.buildingCatalog,
    }),
    shallow
  );

  const { tap: hapticTap } = useHaptic();
  const { scrollRef, scrollToTop } = useScrollToTop();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const { toast } = useNotification();
  const { safeArea } = useSafeArea();
  const { bottom: safeBottom } = safeArea.safe;
  const scrollPaddingBottom = useMemo(
    () => TAB_BAR_RESERVE_PX + Math.max(0, safeBottom),
    [safeBottom]
  );
  const floatingButtonOffset = useMemo(() => Math.max(0, safeBottom) + 80, [safeBottom]);
  const previousStreakRef = useRef(streakCount);

  const handleTap = () => {
    tap(1);
    hapticTap();
  };

  // Track scroll position for showing back-to-tap button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setIsScrolled(target.scrollTop > 100);
  };

  // Reset scroll position when switching tabs
  useEffect(() => {
    setIsScrolled(false);
    if (activeTab === 'home' && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab, scrollRef]);

  useEffect(() => {
    loadPrestigeStatus();
  }, [loadPrestigeStatus]);

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
  const multiplierLabel = useMemo(() => {
    const prestigePart = Math.max(1, prestigeMultiplier);
    const boostPart = Math.max(1, boostMultiplier);
    return `Престиж ×${prestigePart.toFixed(2)} · Буст ×${boostPart.toFixed(2)}`;
  }, [prestigeMultiplier, boostMultiplier]);

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

  useEffect(() => {
    if (previousStreakRef.current > 0 && streakCount === 0 && activeTab === 'home') {
      toast('Комбо прервано — удерживай темп!', 2400, 'warning');
    }
    previousStreakRef.current = streakCount;
  }, [streakCount, toast, activeTab]);

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
          <ScreenTransition
            key="home"
            type="fade"
            id="tab-panel-home"
            role="tabpanel"
            aria-labelledby="tab-home"
          >
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
              prestigeLevel={prestigeLevel}
              prestigeMultiplier={prestigeMultiplier}
              prestigeEnergySinceReset={prestigeEnergySinceReset}
              prestigeNextThreshold={prestigeNextThreshold}
              prestigeEnergyToNext={prestigeEnergyToNext}
              prestigeGainAvailable={prestigeGainAvailable}
              isPrestigeAvailable={isPrestigeAvailable}
              isPrestigeLoading={isPrestigeLoading}
              onPrestige={performPrestige}
              onTap={handleTap}
            />
          </ScreenTransition>
        );
      case 'shop':
        return (
          <ScreenTransition
            key="shop"
            type="slide"
            className="flex-1"
            id="tab-panel-shop"
            role="tabpanel"
            aria-labelledby="tab-shop"
          >
            <Suspense fallback={<ShopSkeleton />}>
              <ShopPanel showHeader={false} />
            </Suspense>
          </ScreenTransition>
        );
      case 'boosts':
        return (
          <ScreenTransition
            key="boosts"
            type="slide"
            className="flex-1"
            id="tab-panel-boosts"
            role="tabpanel"
            aria-labelledby="tab-boosts"
          >
            <Suspense fallback={<ShopSkeleton />}>
              <BoostHub showHeader={false} />
            </Suspense>
          </ScreenTransition>
        );
      case 'builds':
        return (
          <ScreenTransition
            key="builds"
            type="slide"
            className="flex-1"
            id="tab-panel-builds"
            role="tabpanel"
            aria-labelledby="tab-builds"
          >
            <Suspense fallback={<BuildingSkeleton />}>
              <BuildingsPanel showHeader={false} />
            </Suspense>
          </ScreenTransition>
        );
      case 'leaderboard':
        return (
          <ScreenTransition
            key="leaderboard"
            type="slide"
            className="flex-1"
            id="tab-panel-leaderboard"
            role="tabpanel"
            aria-labelledby="tab-leaderboard"
          >
            <Suspense fallback={<LeaderboardSkeleton />}>
              <LeaderboardPanel />
            </Suspense>
          </ScreenTransition>
        );
      case 'profile':
        return (
          <ScreenTransition
            key="profile"
            type="slide"
            className="flex-1"
            id="tab-panel-profile"
            role="tabpanel"
            aria-labelledby="tab-profile"
          >
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfilePanel />
            </Suspense>
          </ScreenTransition>
        );
      case 'settings':
        return (
          <ScreenTransition
            key="settings"
            type="slide"
            className="flex-1"
            id="tab-panel-settings"
            role="tabpanel"
            aria-labelledby="tab-settings"
          >
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
    <ScrollContainerContext.Provider value={scrollContainer}>
      <div className="flex flex-col w-full h-full relative overflow-hidden flex-1">
        <div
          ref={node => {
            if (scrollRef.current !== node) {
              scrollRef.current = node;
              setScrollContainer(node);
            }
          }}
          className="flex flex-col overflow-y-auto flex-1 min-h-0 relative"
          style={{
            paddingBottom: `${scrollPaddingBottom}px`,
          }}
          onScroll={handleScroll}
        >
          {activeTab === 'home' ? (
            renderActiveTab()
          ) : (
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h2 className="m-0 text-xl font-semibold text-[var(--color-text-primary)]">
                  {TAB_META[activeTab].title}
                </h2>
                <p className="m-0 text-sm text-[var(--color-text-secondary)]">
                  {TAB_META[activeTab].description}
                </p>
              </div>
              {renderActiveTab()}
            </div>
          )}

          {/* Back to Tap Button (floating) */}
          {activeTab !== 'home' && isScrolled && !isLoading && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                onTabChange('home');
                scrollToTop(true);
              }}
              className="fixed right-4 z-40 px-4 py-2 rounded-full bg-gradient-to-r from-cyan/20 to-lime/20 border border-cyan/50 hover:border-cyan hover:from-cyan/30 hover:to-lime/30 transition-all duration-200 text-sm font-medium text-[var(--color-text-primary)] active:scale-95 shadow-glow"
              style={{
                bottom: `${floatingButtonOffset}px`,
              }}
              title="Back to Tap"
              aria-label="Back to Tap"
              type="button"
            >
              <span className="text-base">🌍</span>
            </motion.button>
          )}
        </div>
      </div>
    </ScrollContainerContext.Provider>
  );
}
