/**
 * Main Game Screen
 */

import { useEffect, useMemo, useState } from 'react';
import { streakConfig, useGameStore } from '../store/gameStore';
import { HomePanel } from '../components/HomePanel';
import { ShopPanel } from '../components/ShopPanel';
import { BoostHub } from '../components/BoostHub';
import { BuildingsPanel } from '../components/BuildingsPanel';
import { LeaderboardPanel } from '../components/LeaderboardPanel';
import { ProfilePanel } from '../components/ProfilePanel';
import { SettingsScreen } from '../components/settings';
import { ScreenTransition, TabBar, type TabBarItem } from '../components';
import { useHaptic } from '../hooks/useHaptic';
import { formatNumberWithSpaces } from '../utils/number';

type TabKey = 'home' | 'shop' | 'boosts' | 'builds' | 'leaderboard' | 'profile' | 'settings';

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
  const [activeTab, setActiveTab] = useState<TabKey>('shop');

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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ScreenTransition key="home" type="fade">
            <HomePanel
              energy={energy}
              level={level}
              xpProgress={xpProgress}
              xpProgressLabel={xpProgressLabel}
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

      <TabBar
        tabs={[
          { id: 'home', icon: '🏠', label: 'Главная', title: 'Home' },
          { id: 'shop', icon: '🛍️', label: 'Магазин', title: 'Shop' },
          { id: 'boosts', icon: '🚀', label: 'Boost Hub', title: 'Boosts' },
          { id: 'builds', icon: '🏗️', label: 'Постройки', title: 'Buildings' },
          { id: 'leaderboard', icon: '🏆', label: 'Рейтинг', title: 'Leaderboard' },
          { id: 'profile', icon: '👤', label: 'Профиль', title: 'Profile' },
          { id: 'settings', icon: '⚙️', label: 'Настройки', title: 'Settings' },
        ] as TabBarItem[]}
        active={activeTab}
        onChange={(tabId) => setActiveTab(tabId as TabKey)}
      />
    </div>
  );
}
