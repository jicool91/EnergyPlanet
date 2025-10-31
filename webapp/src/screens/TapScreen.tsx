import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import {
  AchievementsModal,
  TapCircle,
  StatsSummary,
  DailyTasksBar,
  Card,
  TabPageSurface,
} from '@/components';
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

interface PurchaseInsight {
  name: string;
  cost: number;
  affordable: boolean;
  remaining: number;
  roiRank: number | null;
  paybackSeconds: number | null;
  incomeGain: number;
}

function PurchaseInsightCard({
  insight,
  onOpenShop,
}: {
  insight: PurchaseInsight;
  onOpenShop: (section?: ShopSection) => void;
}) {
  const { name, cost, affordable, remaining, paybackSeconds, incomeGain } = insight;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Следующая цель
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{name}</p>
        </div>
        <span className="rounded-full bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-[var(--color-text-secondary)]">
          Стоимость {cost.toLocaleString('ru-RU')}
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Доход в секунду: +{incomeGain.toLocaleString('ru-RU')}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {affordable ? (
            <span className="text-[var(--color-success)]">Можно купить прямо сейчас</span>
          ) : (
            <>Осталось накопить: {remaining.toLocaleString('ru-RU')}</>
          )}
        </div>
        <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          {paybackSeconds
            ? `Окупится за ~${Math.round(paybackSeconds / 60)} мин`
            : 'Окупаемость не указана'}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onOpenShop('boosts')}
          className="rounded-2xl bg-[var(--color-accent-gold)] px-4 py-2 text-sm font-semibold text-[var(--color-bg-primary)] shadow-[0_14px_36px_rgba(243,186,47,0.26)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-bg-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-accent-gold)]"
        >
          Улучшить сейчас
        </button>
      </div>
    </Card>
  );
}

export function TapScreen() {
  const navigate = useNavigate();
  const { toast } = useNotification();
  const { tap: hapticTap } = useHaptic();

  const {
    energy,
    level,
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
      level: state.level,
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
  const overallMultiplier = useMemo(
    () => boostMultiplier * prestigeMultiplier * Math.max(1, achievementMultiplier),
    [boostMultiplier, prestigeMultiplier, achievementMultiplier]
  );

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

  const nextBoostAvailabilityMs = useMemo(() => {
    if (!Array.isArray(boostHub) || boostHub.length === 0) {
      return undefined;
    }

    const currentServerMs = clientNowMs + (boostHubTimeOffsetMs ?? 0);
    let nextAvailabilityMs: number | undefined;
    let hasReadyBoost = false;

    boostHub.forEach(item => {
      if (item.active) {
        // active boost не влияет на таймер следующего — пропускаем
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

    return nextAvailabilityMs;
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
      <div className="flex flex-col gap-6">
        <TapCircle
          onTap={handleTap}
          streakCount={streakCount}
          tapLevel={tapLevel}
          boostMultiplier={overallMultiplier}
          isCriticalStreak={isCriticalStreak}
        />

        <StatsSummary
          energy={energy}
          tapIncomeDisplay={tapIncomeDisplay}
          passiveIncomeLabel={passiveIncomeLabel}
          streakCount={streakCount}
          bestStreak={bestStreak}
          multiplierLabel={multiplierLabel}
          multiplierParts={multiplierParts}
          prestigeLevel={prestigeLevel}
          prestigeMultiplier={prestigeMultiplier}
          prestigeEnergySinceReset={prestigeEnergySinceReset}
          prestigeEnergyToNext={prestigeEnergyToNext}
          prestigeGainAvailable={prestigeGainAvailable}
          prestigeNextThreshold={prestigeNextThreshold}
          isPrestigeAvailable={isPrestigeAvailable}
          isPrestigeLoading={isPrestigeLoading}
          onPrestige={performPrestige}
        />

        <DailyTasksBar
          nextBoostAvailabilityMs={nextBoostAvailabilityMs}
          claimableAchievements={claimableAchievementsCount}
          onViewBoosts={handleViewBoosts}
          onViewAchievements={handleViewAchievements}
          onViewLeaderboard={handleViewLeaderboard}
          socialPlayerCount={leaderboardTotal}
          isSocialBlockLoading={!leaderboardLoaded && isLeaderboardLoading}
        />

        {purchaseInsight ? (
          <PurchaseInsightCard insight={purchaseInsight} onOpenShop={handleOpenShop} />
        ) : null}

        <TabPageSurface className="gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                  Сообщество
                </p>
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {leaderboardTotal.toLocaleString('ru-RU')} игроков онлайн
                </p>
              </div>
              <button
                type="button"
                onClick={handleViewLeaderboard}
                className="rounded-2xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
              >
                Смотреть рейтинг
              </button>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Тапай быстрее, чтобы обогнать друзей и открыть новые награды.
            </p>
          </Card>
        </TabPageSurface>
      </div>

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
