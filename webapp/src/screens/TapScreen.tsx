import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { HomePanel } from '@/components/HomePanel';
import { AchievementsModal } from '@/components/AchievementsModal';
import { useNotification } from '@/hooks/useNotification';
import { useHaptic } from '@/hooks/useHaptic';
import { streakConfig, useGameStore } from '@/store/gameStore';
import { useCatalogStore } from '@/store/catalogStore';
import { useAuthStore } from '@/store/authStore';
import { describeError } from '@/store/storeUtils';
import { logClientEvent } from '@/services/telemetry';
import type { ShopSection } from '@/components/ShopPanel';

const SECTION_QUERY_PARAM = 'section';

function buildExchangeUrl(section: ShopSection) {
  const params = new URLSearchParams();
  params.set(SECTION_QUERY_PARAM, section);
  return `/exchange?${params.toString()}`;
}

export function TapScreen() {
  const navigate = useNavigate();
  const { toast } = useNotification();
  const { tap: hapticTap } = useHaptic();

  const {
    energy,
    stars,
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
    isInitialized,
    buildings,
    leaderboardTotal,
    leaderboardLoaded,
    isLeaderboardLoading,
    achievementMultiplier,
    achievements,
    achievementsLoaded,
    achievementsLoading,
    achievementsError,
    claimingAchievementSlug,
  } = useGameStore(
    useShallow(state => ({
      energy: state.energy,
      stars: state.stars,
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
      isInitialized: state.isInitialized,
      buildings: state.buildings,
      leaderboardTotal: state.leaderboardTotal,
      leaderboardLoaded: state.leaderboardLoaded,
      isLeaderboardLoading: state.isLeaderboardLoading,
      achievementMultiplier: state.achievementMultiplier,
      achievements: state.achievements,
      achievementsLoaded: state.achievementsLoaded,
      achievementsLoading: state.achievementsLoading,
      achievementsError: state.achievementsError,
      claimingAchievementSlug: state.claimingAchievementSlug,
    }))
  );

  const {
    tap,
    resetStreak,
    loadLeaderboard,
    loadPrestigeStatus,
    performPrestige,
    loadAchievements,
    claimAchievement,
  } = useGameStore(
    useShallow(state => ({
      tap: state.tap,
      resetStreak: state.resetStreak,
      loadLeaderboard: state.loadLeaderboard,
      loadPrestigeStatus: state.loadPrestigeStatus,
      performPrestige: state.performPrestige,
      loadAchievements: state.loadAchievements,
      claimAchievement: state.claimAchievement,
    }))
  );

  const { buildingCatalog, boostHub, boostHubTimeOffsetMs } = useCatalogStore(
    useShallow(state => ({
      buildingCatalog: state.buildingCatalog,
      boostHub: state.boostHub,
      boostHubTimeOffsetMs: state.boostHubTimeOffsetMs,
    }))
  );

  const authReady = useAuthStore(state => state.authReady);
  const [clientNowMs, setClientNowMs] = useState(() => Date.now());
  const [isAchievementsOpen, setAchievementsOpen] = useState(false);
  const previousStreakRef = useRef(streakCount);

  useEffect(() => {
    if (!isInitialized || !authReady) {
      return;
    }
    loadPrestigeStatus();
  }, [isInitialized, authReady, loadPrestigeStatus]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    loadLeaderboard();
  }, [authReady, loadLeaderboard]);

  useEffect(() => {
    const tick = () => setClientNowMs(Date.now());
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isAchievementsOpen) {
      return;
    }
    loadAchievements().catch(error => {
      console.warn('Failed to load achievements', error);
    });
  }, [isAchievementsOpen, loadAchievements]);

  useEffect(() => {
    if (streakCount === 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (!lastTapAt) {
        return;
      }
      if (Date.now() - lastTapAt > streakConfig.resetMs) {
        resetStreak();
      }
    }, 400);

    return () => window.clearInterval(timer);
  }, [streakCount, lastTapAt, resetStreak]);

  useEffect(() => {
    if (previousStreakRef.current > 0 && streakCount === 0) {
      toast('Комбо прервано — удерживай темп!', 2400, 'warning');
    }
    previousStreakRef.current = streakCount;
  }, [streakCount, toast]);

  const handleTap = useCallback(() => {
    tap(1)
      .then(() => {
        hapticTap();
      })
      .catch(error => {
        const { status, message } = describeError(error, 'Не удалось выполнить тап');
        if (status === 429) {
          toast('Слишком быстро! Попробуйте чуть позже.', 3000, 'warning');
        } else {
          toast(message, 4000, 'error');
        }
        void logClientEvent('tap_error', { status, message }, 'warn');
      });
  }, [tap, hapticTap, toast]);

  const tapIncomeDisplay = useMemo(
    () => Math.max(0, tapIncome).toLocaleString('ru-RU'),
    [tapIncome]
  );

  const xpTotalForLevel = xpIntoLevel + xpToNextLevel;
  const xpProgress = xpTotalForLevel > 0 ? Math.min(1, xpIntoLevel / xpTotalForLevel) : 0;
  const xpRemaining = xpToNextLevel;

  const passiveIncomeLabel = useMemo(() => {
    if (passiveIncomePerSec <= 0) {
      return '—';
    }
    const value =
      passiveIncomePerSec >= 10 ? Math.round(passiveIncomePerSec) : passiveIncomePerSec.toFixed(1);
    return `${value} E/с`;
  }, [passiveIncomePerSec]);

  const multiplierParts = useMemo(() => {
    const prestigePart = Math.max(1, prestigeMultiplier);
    const boostPart = Math.max(1, boostMultiplier);
    const parts: string[] = [`Престиж ×${prestigePart.toFixed(2)}`];
    if (boostPart > 1.001) {
      parts.push(`Буст ×${boostPart.toFixed(2)}`);
    }
    if (achievementMultiplier > 1.001) {
      parts.push(`Достижения +${Math.round((achievementMultiplier - 1) * 100)}%`);
    }
    return parts;
  }, [prestigeMultiplier, boostMultiplier, achievementMultiplier]);

  const multiplierLabel = useMemo(() => {
    return multiplierParts.join(' · ');
  }, [multiplierParts]);

  const claimableAchievementsCount = useMemo(() => {
    if (!Array.isArray(achievements)) {
      return 0;
    }
    return achievements.reduce((sum, item) => (item.claimableTier ? sum + 1 : sum), 0);
  }, [achievements]);

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
  }, [buildingCatalog, buildings, energy, level]);

  const { activeBoostSummary, nextBoostAvailabilityMs } = useMemo(() => {
    if (!Array.isArray(boostHub) || boostHub.length === 0) {
      return { activeBoostSummary: null, nextBoostAvailabilityMs: undefined };
    }

    const currentServerMs = clientNowMs + (boostHubTimeOffsetMs ?? 0);
    let activeSummary: { boostType: string; multiplier: number; remainingMs: number } | null = null;
    let nextAvailabilityMs: number | undefined;
    let hasReadyBoost = false;

    boostHub.forEach(item => {
      if (item.active) {
        const expiresAtMs = item.active.expires_at ? Date.parse(item.active.expires_at) : null;
        const remainingMs =
          expiresAtMs !== null
            ? Math.max(0, expiresAtMs - currentServerMs)
            : (item.active.remaining_seconds ?? 0) * 1000;
        if (
          !activeSummary ||
          remainingMs > activeSummary.remainingMs ||
          item.multiplier > activeSummary.multiplier
        ) {
          activeSummary = {
            boostType: item.boost_type,
            multiplier: item.multiplier,
            remainingMs,
          };
        }
      } else {
        const cooldownSeconds = item.cooldown_remaining_seconds ?? 0;
        const availableAtMs = item.available_at ? Date.parse(item.available_at) : null;
        let untilMs = cooldownSeconds > 0 ? cooldownSeconds * 1000 : 0;
        if (untilMs === 0 && availableAtMs !== null) {
          untilMs = Math.max(0, availableAtMs - currentServerMs);
        }

        if (untilMs <= 0) {
          hasReadyBoost = true;
        } else {
          nextAvailabilityMs =
            nextAvailabilityMs === undefined ? untilMs : Math.min(nextAvailabilityMs, untilMs);
        }
      }
    });

    if (hasReadyBoost) {
      nextAvailabilityMs = 0;
    }

    return { activeBoostSummary: activeSummary, nextBoostAvailabilityMs: nextAvailabilityMs };
  }, [boostHub, boostHubTimeOffsetMs, clientNowMs]);

  const handleViewBoosts = useCallback(() => {
    void logClientEvent('home_boosts_cta_click', { source: 'tap_screen' });
    navigate(buildExchangeUrl('boosts'));
  }, [navigate]);

  const handleViewAchievements = useCallback(() => {
    void logClientEvent('home_achievements_click', { source: 'tap_screen' });
    setAchievementsOpen(true);
  }, []);

  const handleOpenShop = useCallback(
    (section: ShopSection = 'star_packs') => {
      void logClientEvent('home_shop_shortcut_click', { source: 'tap_screen', section });
      navigate(buildExchangeUrl(section));
    },
    [navigate]
  );

  const handleViewLeaderboard = useCallback(() => {
    void logClientEvent('social_proof_leaderboard_click', { source: 'tap_screen' });
    navigate('/friends');
  }, [navigate]);

  if (isLoading && !isInitialized) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-sm text-[var(--color-text-secondary)]">Загрузка Energy Planet…</p>
      </div>
    );
  }

  return (
    <>
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
        passiveIncomePerSec={passiveIncomePerSec}
        multiplierLabel={multiplierLabel}
        multiplierParts={multiplierParts}
        stars={stars}
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
        onViewLeaderboard={handleViewLeaderboard}
        socialPlayerCount={leaderboardTotal}
        isSocialBlockLoading={!leaderboardLoaded && isLeaderboardLoading}
        activeBoost={activeBoostSummary ?? undefined}
        nextBoostAvailabilityMs={nextBoostAvailabilityMs}
        onViewBoosts={handleViewBoosts}
        onViewAchievements={handleViewAchievements}
        onOpenShop={handleOpenShop}
        claimableAchievements={claimableAchievementsCount}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setAchievementsOpen(false)}
        achievements={achievements}
        loading={achievementsLoading && !achievementsLoaded}
        error={achievementsError}
        onRetry={() => loadAchievements(true)}
        onClaim={claimAchievement}
        claimingSlug={claimingAchievementSlug}
        achievementMultiplier={achievementMultiplier}
      />
    </>
  );
}
