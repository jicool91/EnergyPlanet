/**
 * HomePanel Component
 * Tap-first main game screen with centered energy button
 *
 * Features:
 * - Big tap button in center (main CTA)
 * - Collapsed stats panel (Energy, Level, XP progress)
 * - XP progress bar
 * - Next goal card (recommended building)
 * - Responsive design (mobile-first)
 */

import { useMemo, useEffect, useRef, useCallback, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Card } from './Card';
import { StatCard } from './StatCard';
import { XPProgressCard } from './XPProgressCard';
import { SocialProofCard } from './SocialProofCard';
import { DailyRewardBanner } from './DailyRewardBanner';
import { useDevicePerformance } from '../hooks';
import { formatNumberWithSpaces, formatCompactNumber } from '../utils/number';
import { PrestigeCard } from './PrestigeCard';
import { Button } from './Button';
import { ModalBase } from './ModalBase';
import { logClientEvent } from '@/services/telemetry';
import { useQuestStore, type QuestView } from '@/store/questStore';
import { useShallow } from 'zustand/react/shallow';
import { canShowCap, consumeCap } from '@/utils/frequencyCap';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function CollapsibleSection({
  title,
  description,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section
      className="rounded-2xl border border-[var(--color-border-subtle)] bg-[rgba(12,18,40,0.78)] p-md shadow-[0_12px_28px_rgba(0,0,0,0.28)]"
      aria-expanded={isOpen}
    >
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex w-full items-center justify-between gap-sm text-left"
      >
        <div className="flex flex-col gap-xs">
          <span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
          {description ? (
            <span className="text-sm text-[var(--color-text-secondary)]">{description}</span>
          ) : null}
        </div>
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[rgba(0,0,0,0.2)] text-sm font-semibold text-[var(--color-text-secondary)]"
          aria-hidden
        >
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen ? <div className="mt-sm flex flex-col gap-sm">{children}</div> : null}
    </section>
  );
}

export interface HomePanelProps {
  // Game state
  energy: number;
  level: number;
  xpProgress: number; // 0-1
  xpIntoLevel: number;
  xpToNextLevel: number;
  xpRemaining: number;
  tapLevel: number;
  tapIncomeDisplay: string;
  passiveIncomeLabel: string;
  multiplierLabel: string;
  passiveIncomePerSec: number;
  multiplierParts?: string[];
  stars: number;
  streakCount: number;
  bestStreak: number;
  isCriticalStreak: boolean;
  prestigeLevel: number;
  prestigeMultiplier: number;
  prestigeEnergySinceReset: number;
  prestigeNextThreshold: number;
  prestigeEnergyToNext: number;
  prestigeGainAvailable: number;
  isPrestigeAvailable: boolean;
  isPrestigeLoading: boolean;
  onPrestige: () => void;

  // Next goal
  purchaseInsight?: {
    name: string;
    cost: number;
    affordable: boolean;
    remaining: number;
    roiRank?: number | null;
    paybackSeconds?: number | null;
    incomeGain: number;
  };

  // Actions
  onTap: () => void;
  onViewLeaderboard?: () => void;
  socialPlayerCount?: number;
  isSocialBlockLoading?: boolean;
  activeBoost?: {
    boostType: string;
    multiplier: number;
    remainingMs: number;
  };
  nextBoostAvailabilityMs?: number | undefined;
  onViewBoosts?: () => void;
  onViewAchievements?: () => void;
  onOpenShop?: (section?: 'star_packs' | 'boosts') => void;
  claimableAchievements?: number;
}

export function HomePanel({
  energy,
  level,
  xpProgress,
  xpIntoLevel,
  xpToNextLevel,
  xpRemaining,
  tapLevel,
  tapIncomeDisplay,
  passiveIncomeLabel,
  multiplierLabel,
  stars,
  streakCount,
  bestStreak,
  isCriticalStreak,
  purchaseInsight,
  prestigeLevel,
  prestigeMultiplier,
  prestigeEnergySinceReset,
  prestigeNextThreshold,
  prestigeEnergyToNext,
  prestigeGainAvailable,
  isPrestigeAvailable,
  isPrestigeLoading,
  onPrestige,
  onTap,
  onViewLeaderboard,
  socialPlayerCount = 0,
  isSocialBlockLoading = false,
  activeBoost,
  nextBoostAvailabilityMs,
  onViewBoosts,
  onViewAchievements,
  onOpenShop,
  claimableAchievements = 0,
  passiveIncomePerSec,
  multiplierParts,
}: HomePanelProps) {
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
  const heroEnergyValue = useMemo(() => `${energyCompact} E`, [energyCompact]);
  const effectiveMultiplierParts = useMemo(() => {
    if (Array.isArray(multiplierParts) && multiplierParts.length > 0) {
      return multiplierParts;
    }
    return multiplierLabel.split(' · ').filter(Boolean);
  }, [multiplierLabel, multiplierParts]);
  const heroCardDetails = useMemo(() => {
    const progressPercent = Math.round(Math.max(0, Math.min(1, xpProgress)) * 100);
    const safePercent = Math.max(progressPercent > 0 ? progressPercent : 4, 4);
    const totalForLevel = xpIntoLevel + xpRemaining;
    const xpNeededLabel =
      xpRemaining > 0
        ? `До уровня: ${formatCompactNumber(Math.max(0, xpRemaining))} XP`
        : 'Можно повышать уровень';
    const xpSummary =
      totalForLevel > 0
        ? `Пройдено: ${formatCompactNumber(Math.max(0, xpIntoLevel))} / ${formatCompactNumber(Math.max(0, totalForLevel))} XP`
        : null;

    return (
      <div className="flex flex-col gap-xs">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-xs rounded-full bg-[rgba(255,255,255,0.12)] px-sm py-xs text-label uppercase tracking-[0.18em] text-[var(--color-text-primary)]">
            Уровень {level}
          </span>
          <span className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.16)] bg-[rgba(0,0,0,0.32)] px-sm py-xs text-label uppercase tracking-[0.18em] text-[var(--color-text-accent)]">
            {progressPercent}%
          </span>
        </div>
        <div className="h-[6px] w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-success)] to-[var(--color-gold)] shadow-glow"
            style={{ width: `${Math.min(100, safePercent)}%` }}
          />
        </div>
        <p className="m-0 text-caption text-[var(--color-text-secondary)]">{xpNeededLabel}</p>
        {xpSummary && (
          <p className="m-0 text-caption text-[var(--color-text-secondary)]/80">{xpSummary}</p>
        )}
      </div>
    );
  }, [level, xpIntoLevel, xpProgress, xpRemaining]);
  const passivePrimaryDisplay = useMemo(() => {
    if (passiveIncomePerSec <= 0) {
      return passiveIncomeLabel;
    }
    return `${formatCompactNumber(passiveIncomePerSec)} E/с`;
  }, [passiveIncomeLabel, passiveIncomePerSec]);
  const passiveCardDetails = useMemo(() => {
    if (passiveIncomePerSec <= 0) {
      return 'Постройте здания, чтобы получать доход даже офлайн';
    }
    const perMinute = passiveIncomePerSec * 60;
    const perHour = passiveIncomePerSec * 3600;
    return (
      <div className="flex flex-col gap-xs">
        <div className="flex flex-wrap items-baseline gap-sm text-caption text-[var(--color-text-secondary)]/90">
          <span>≈ {formatCompactNumber(perMinute)} E/мин</span>
          <span className="opacity-60">·</span>
          <span>≈ {formatCompactNumber(perHour)} E/час</span>
        </div>
        {effectiveMultiplierParts.length > 0 && (
          <div className="flex flex-wrap gap-xs">
            {effectiveMultiplierParts.map(part => (
              <span
                key={part}
                className="inline-flex items-center gap-xs rounded-full border border-[rgba(0,217,255,0.22)] bg-[rgba(12,18,40,0.64)] px-sm py-xs text-micro uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
              >
                {part}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }, [effectiveMultiplierParts, passiveIncomePerSec]);
  const performance = useDevicePerformance();
  const isLowPerformance = performance === 'low';
  const isMediumPerformance = performance === 'medium';
  const prefersReducedMotion = useReducedMotion();
  const disableHeavyMotion = prefersReducedMotion || isLowPerformance;
  const hoverAnimation = disableHeavyMotion ? undefined : { scale: 1.04 };
  const tapAnimation = disableHeavyMotion ? { scale: 0.98 } : { scale: 0.94 };
  const glowClassName = disableHeavyMotion
    ? 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-12 -z-10'
    : 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-20 blur-xl -z-10';
  const glowAnimation = disableHeavyMotion
    ? undefined
    : {
        scale: [1, isMediumPerformance ? 1.08 : 1.16, 1],
        opacity: [0.12, 0.24, 0.12],
      };
  const glowTransition = disableHeavyMotion
    ? undefined
    : {
        duration: isMediumPerformance ? 2.4 : 2,
        repeat: Infinity,
      };
  const hasLoggedMonetizationPromptRef = useRef(false);
  const [, setMonetizationCapRevision] = useState(0);
  const monetizationCapAllowed = canShowCap('home_monetization_prompt', { limit: 3 });
  const starsShort = useMemo(() => formatCompactNumber(Math.floor(stars)), [stars]);
  const hasStreakRewards = claimableAchievements > 0;
  const streakCtaLabel = useMemo(() => {
    if (hasStreakRewards) {
      return `Забрать +${claimableAchievements}`;
    }
    return streakCount > 0 ? 'Продолжить серию' : 'Начать серию';
  }, [claimableAchievements, hasStreakRewards, streakCount]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const refreshCap = () => {
      setMonetizationCapRevision(prev => prev + 1);
    };
    document.addEventListener('visibilitychange', refreshCap);
    window.addEventListener('focus', refreshCap);
    return () => {
      document.removeEventListener('visibilitychange', refreshCap);
      window.removeEventListener('focus', refreshCap);
    };
  }, []);

  const showMonetizationPrompt = useMemo(() => {
    if (!monetizationCapAllowed) {
      return false;
    }
    if (!purchaseInsight || purchaseInsight.remaining == null) {
      return false;
    }
    if (purchaseInsight.remaining <= 0) {
      return false;
    }
    return stars < purchaseInsight.remaining;
  }, [purchaseInsight, stars, monetizationCapAllowed]);

  useEffect(() => {
    if (showMonetizationPrompt && !hasLoggedMonetizationPromptRef.current) {
      const consumed = consumeCap('home_monetization_prompt', { limit: 3 });
      setMonetizationCapRevision(prev => prev + 1);
      if (consumed) {
        hasLoggedMonetizationPromptRef.current = true;
        void logClientEvent('monetization_prompt_view', {
          source: 'home_panel',
          deficit: purchaseInsight ? purchaseInsight.remaining - stars : null,
        });
      }
    }
    if (!showMonetizationPrompt) {
      hasLoggedMonetizationPromptRef.current = false;
    }
  }, [purchaseInsight, showMonetizationPrompt, stars]);

  const handleMonetizationClick = useCallback(() => {
    void logClientEvent('monetization_prompt_click', {
      source: 'home_panel',
    });
    onOpenShop?.('star_packs');
  }, [onOpenShop]);

  const hasLoggedQuestWidgetRef = useRef(false);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [isQuestModalOpen, setQuestModalOpen] = useState(false);

  const {
    quests,
    isLoading: questsLoading,
    error: questsError,
    loadQuests,
    claimQuest,
    lastLoadedAt,
  } = useQuestStore(
    useShallow(state => ({
      quests: state.quests,
      isLoading: state.isLoading,
      error: state.error,
      loadQuests: state.loadQuests,
      claimQuest: state.claimQuest,
      lastLoadedAt: state.lastLoadedAt,
    }))
  );

  useEffect(() => {
    if (!lastLoadedAt && !questsLoading) {
      void loadQuests();
    }
  }, [lastLoadedAt, questsLoading, loadQuests]);

  const dailyQuests = useMemo(() => quests.filter(quest => quest.type === 'daily'), [quests]);

  const weeklyQuests = useMemo(() => quests.filter(quest => quest.type === 'weekly'), [quests]);

  useEffect(() => {
    if (!questsLoading && quests.length > 0 && !hasLoggedQuestWidgetRef.current) {
      hasLoggedQuestWidgetRef.current = true;
      void logClientEvent('quest_widget_view', {
        daily: dailyQuests.length,
        weekly: weeklyQuests.length,
      });
    }
    if (quests.length === 0) {
      hasLoggedQuestWidgetRef.current = false;
    }
  }, [quests, questsLoading, dailyQuests.length, weeklyQuests.length]);

  const handleQuestClaim = useCallback(
    async (questId: string) => {
      try {
        setClaimingQuestId(questId);
        await claimQuest(questId);
      } finally {
        setClaimingQuestId(null);
      }
    },
    [claimQuest]
  );

  const questWidgetLoading = questsLoading && quests.length === 0;
  const availableDaily = useMemo(() => dailyQuests.length, [dailyQuests.length]);
  const availableWeekly = useMemo(() => weeklyQuests.length, [weeklyQuests.length]);
  const claimableQuests = useMemo(
    () => quests.filter(quest => quest.status === 'ready').length,
    [quests]
  );
  const hasClaimableQuests = claimableQuests > 0;
  const questCtaLabel = hasClaimableQuests ? 'Забрать награды' : 'Смотреть задания';

  const formatMsToReadable = (ms: number) => {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}ч ${mins.toString().padStart(2, '0')}м`;
    }
    if (minutes > 0) {
      return `${minutes}м ${seconds.toString().padStart(2, '0')}с`;
    }
    return `${seconds}с`;
  };

  return (
    <>
      <div className="flex h-full flex-col lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-stretch lg:gap-lg lg:px-lg lg:py-md">
        {/* Left column: stats + tap CTA */}
        <div className="flex flex-col h-full gap-sm">
          <section className="mx-md flex flex-col items-center gap-md rounded-3xl border border-[rgba(0,217,255,0.18)] bg-[rgba(8,12,30,0.72)] px-lg py-lg shadow-[0_24px_48px_rgba(0,0,0,0.32)] lg:mx-0">
            {streakCount > 0 && (
              <motion.div
                className={`flex items-center gap-sm rounded-full px-sm-plus py-xs-plus border shadow-md backdrop-blur bg-gradient-to-r ${
                  isCriticalStreak
                    ? 'from-red-500/80 to-orange-400/80 border-red-400/70'
                    : 'from-cyan/80 to-lime/70 border-cyan/60'
                }`}
                animate={
                  disableHeavyMotion ? undefined : { opacity: [0.85, 1, 0.85], scale: [1, 1.06, 1] }
                }
                transition={
                  disableHeavyMotion
                    ? undefined
                    : { duration: isCriticalStreak ? 1.2 : 1.8, repeat: Infinity }
                }
              >
                <span className="text-base font-semibold text-black drop-shadow">
                  Серия ×{streakCount}
                </span>
                <span className="text-xs font-medium text-black/80 drop-shadow">
                  Лучший результат ×{bestStreak}
                </span>
              </motion.div>
            )}

            <motion.button
              onClick={onTap}
              whileTap={tapAnimation}
              whileHover={hoverAnimation}
              className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-cyan/50 bg-gradient-to-br from-cyan via-lime to-gold text-4xl font-bold text-black shadow-[0_28px_64px_rgba(0,0,0,0.45)] transition-transform duration-300 md:h-40 md:w-40 focus-ring"
              aria-label="Tap to generate energy"
              data-test-id="tap-button"
            >
              <motion.div
                className={glowClassName}
                animate={glowAnimation}
                transition={glowTransition}
              />
              <span role="img" aria-label="Tap planet to generate energy">
                🌍
              </span>
            </motion.button>

            <div className="grid w-full grid-cols-2 gap-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)]">
              <StatCard
                icon="⚡"
                label="Баланс энергии"
                value={heroEnergyValue}
                subLabel={heroCardDetails}
                tone="positive"
                size="hero"
              />

              <div className="grid grid-rows-[minmax(0,1fr)_auto] gap-sm">
                <StatCard
                  icon="💤"
                  label="Пассивный доход"
                  value={passivePrimaryDisplay}
                  subLabel={passiveCardDetails}
                  tone="default"
                  size="standard"
                />
                <div className="grid grid-cols-2 gap-sm">
                  <StatCard
                    icon="🪐"
                    label="Тап-уровень"
                    value={`Ур. ${tapLevel}`}
                    subLabel={`За тап: +${tapIncomeDisplay} E`}
                    size="compact"
                  />
                  <StatCard
                    icon="⭐"
                    label="Stars"
                    value={`${starsShort}`}
                    subLabel="Используйте для ускорений"
                    size="compact"
                  />
                </div>
              </div>
            </div>
          </section>

          {onViewAchievements && (
            <Card className="mt-sm flex items-center justify-between gap-sm bg-gradient-to-br from-[rgba(0,217,255,0.28)] via-[rgba(0,255,136,0.22)] to-[rgba(120,63,255,0.3)] border-[rgba(0,217,255,0.35)] shadow-glow">
              <div className="flex flex-col gap-xs">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Серия входов
                </span>
                <span className="text-body font-semibold text-[var(--color-text-primary)]">
                  {streakCount > 0 ? `Текущая серия ×${streakCount}` : 'Начните серию сегодня'}
                </span>
                <span className="inline-flex w-fit items-center gap-xs rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(0,0,0,0.28)] px-sm py-xs text-caption text-[var(--color-text-secondary)]">
                  <span aria-hidden="true">🔥</span>
                  Лучший результат ×{bestStreak}
                </span>
              </div>
              <Button
                variant={hasStreakRewards ? 'primary' : 'secondary'}
                size="sm"
                onClick={onViewAchievements}
                className="flex items-center gap-xs shadow-glow"
              >
                <span aria-hidden="true">🏆</span>
                {streakCtaLabel}
              </Button>
            </Card>
          )}

          {showMonetizationPrompt && purchaseInsight && (
            <Card className="mt-sm flex items-center gap-sm bg-gradient-to-r from-[rgba(255,215,0,0.18)] via-[rgba(255,163,0,0.12)] to-[rgba(0,217,255,0.18)] border-[rgba(255,215,0,0.35)]">
              <div className="flex flex-col gap-xs flex-1">
                <p className="m-0 text-body font-semibold text-[var(--color-text-primary)]">
                  Ускорьте {purchaseInsight.name}
                </p>
                <p className="m-0 text-caption text-[var(--color-text-secondary)]">
                  Нужно ещё{' '}
                  {formatNumberWithSpaces(Math.max(0, Math.ceil(purchaseInsight.remaining ?? 0)))}{' '}
                  E. У вас
                  {` ⭐ ${formatNumberWithSpaces(Math.max(0, Math.floor(stars)))}`} — докупите
                  Stars, чтобы закрыть цель быстрее.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={handleMonetizationClick}
                className="shadow-glow"
              >
                🛍️ В магазин
              </Button>
            </Card>
          )}

          <Card className="mt-sm flex flex-col gap-sm bg-gradient-to-br from-[rgba(0,217,255,0.2)] via-[rgba(0,255,136,0.18)] to-[rgba(120,63,255,0.2)] border-[rgba(0,217,255,0.32)] shadow-elevation-2">
            <div className="flex items-start justify-between gap-sm">
              <div className="flex flex-col gap-xs">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Задания
                </span>
                <span className="text-body font-semibold text-[var(--color-text-primary)]">
                  {availableDaily + availableWeekly > 0
                    ? `Активно ${availableDaily + availableWeekly} заданий`
                    : 'Нет доступных заданий'}
                </span>
                <span className="text-caption text-[var(--color-text-secondary)] opacity-80">
                  {claimableQuests > 0
                    ? `Готово к получению: ${claimableQuests} наград`
                    : 'Выполняйте квесты, чтобы получить бонусы'}
                </span>
              </div>
              <div className="flex flex-col items-end gap-xs min-w-[140px]">
                <div className="flex flex-wrap justify-end gap-xs">
                  <span className="inline-flex items-center gap-xs rounded-full border border-[rgba(0,217,255,0.22)] bg-[rgba(0,217,255,0.12)] px-sm py-xs text-caption text-[var(--color-text-secondary)]">
                    Дневных {availableDaily}
                  </span>
                  <span className="inline-flex items-center gap-xs rounded-full border border-[rgba(120,63,255,0.28)] bg-[rgba(120,63,255,0.18)] px-sm py-xs text-caption text-[var(--color-text-secondary)]">
                    Недельных {availableWeekly}
                  </span>
                </div>
                {questsError ? (
                  <span className="text-caption text-[var(--color-text-destructive)]">
                    {questsError}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between gap-sm">
              <span className="text-caption text-[var(--color-text-secondary)]">
                {questWidgetLoading
                  ? 'Загружаем задания…'
                  : hasClaimableQuests
                    ? 'Награды готовы к сбору'
                    : 'Ежедневные задания обновляются каждые 24 часа'}
              </span>
              <Button
                size="sm"
                variant={hasClaimableQuests ? 'primary' : 'secondary'}
                disabled={questWidgetLoading || quests.length === 0}
                onClick={() => setQuestModalOpen(true)}
                className="shadow-glow"
              >
                <span aria-hidden="true">📋</span>
                {questCtaLabel}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right column: grouped insights */}
        <div className="flex flex-col gap-sm-plus px-md py-sm lg:px-0 lg:py-0">
          <CollapsibleSection
            title="Ежедневные бонусы"
            description="Заберите подарок и держите бусты активными, чтобы ускорять прогресс."
          >
            <DailyRewardBanner onOpenBoosts={onViewBoosts} onOpenShop={onOpenShop} />
            {activeBoost ? (
              <Card className="flex items-center justify-between gap-sm-plus bg-lime/15 border-lime/40">
                <div>
                  <p className="m-0 text-xs font-semibold text-lime-400">Активный буст</p>
                  <p className="m-0 text-sm text-[var(--color-text-primary)] font-semibold">
                    ×{activeBoost.multiplier.toFixed(1)} к доходу
                  </p>
                  <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                    Осталось {formatMsToReadable(activeBoost.remainingMs)}
                  </p>
                </div>
                {onViewBoosts && (
                  <Button variant="ghost" size="sm" onClick={onViewBoosts}>
                    Управлять
                  </Button>
                )}
              </Card>
            ) : typeof nextBoostAvailabilityMs !== 'undefined' ? (
              <Card className="flex items-center justify-between gap-sm-plus bg-cyan/10 border-cyan/30">
                <div>
                  <p className="m-0 text-xs font-semibold text-cyan-400">
                    {nextBoostAvailabilityMs === 0 ? 'Новый буст доступен' : 'Следующий буст'}
                  </p>
                  <p className="m-0 text-sm text-[var(--color-text-primary)] font-semibold">
                    {nextBoostAvailabilityMs === 0
                      ? 'Свободный буст ждёт вас в Boost Hub'
                      : `Откройте Boost Hub через ${formatMsToReadable(nextBoostAvailabilityMs)}`}
                  </p>
                  <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                    Бусты удваивают пассивный доход и ускоряют новые постройки.
                  </p>
                </div>
                {onViewBoosts && (
                  <Button variant="secondary" size="sm" onClick={onViewBoosts}>
                    Открыть Boost Hub
                  </Button>
                )}
              </Card>
            ) : null}
          </CollapsibleSection>

          <CollapsibleSection
            title="Прогресс и множители"
            description="Следите за уровнем, XP и возможностями престижа."
          >
            <XPProgressCard
              level={level}
              xpProgress={xpProgress}
              xpCurrent={xpIntoLevel}
              xpTotal={xpIntoLevel + xpToNextLevel}
              xpRemaining={xpRemaining}
            />

            <PrestigeCard
              prestigeLevel={prestigeLevel}
              prestigeMultiplier={prestigeMultiplier}
              prestigeEnergySinceReset={prestigeEnergySinceReset}
              prestigeNextThreshold={prestigeNextThreshold}
              prestigeEnergyToNext={prestigeEnergyToNext}
              prestigeGainAvailable={prestigeGainAvailable}
              isPrestigeAvailable={isPrestigeAvailable}
              isLoading={isPrestigeLoading}
              onPrestige={onPrestige}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title="Сообщество и цели"
            description="Сравнивайте результаты с друзьями и выбирайте следующую инвестицию."
            defaultOpen={false}
          >
            <SocialProofCard
              friendsCount={socialPlayerCount}
              isLoading={isSocialBlockLoading}
              onViewLeaderboard={onViewLeaderboard}
            />

            {purchaseInsight && (
              <Card highlighted={purchaseInsight.affordable}>
                <div className="mb-sm-plus flex items-center justify-between gap-sm-plus">
                  <div>
                    <p className="m-0 text-sm font-medium text-[var(--color-text-secondary)]">
                      Следующая цель
                    </p>
                    <h3 className="m-0 text-lg text-[var(--color-text-primary)] font-semibold">
                      {purchaseInsight.name}
                    </h3>
                  </div>
                  {purchaseInsight.roiRank && (
                    <span className="text-xs text-lime/80 font-semibold">
                      ROI #{purchaseInsight.roiRank}
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  Стоимость: {formatNumberWithSpaces(Math.floor(purchaseInsight.cost))} E
                </div>
                {purchaseInsight.remaining > 0 && (
                  <div className="text-sm text-[var(--color-text-secondary)] mt-1">
                    Осталось: {formatNumberWithSpaces(Math.floor(purchaseInsight.remaining))} E
                  </div>
                )}
                {purchaseInsight.paybackSeconds !== undefined &&
                  purchaseInsight.paybackSeconds !== null && (
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Окупаемость: {(purchaseInsight.paybackSeconds / 3600).toFixed(1)} часов
                    </div>
                  )}
              </Card>
            )}
          </CollapsibleSection>
        </div>
      </div>

      <ModalBase
        isOpen={isQuestModalOpen}
        onClose={() => setQuestModalOpen(false)}
        title="Задания"
        size="lg"
        showClose={false}
        actions={[
          {
            label: 'Закрыть',
            variant: 'secondary',
            onClick: () => setQuestModalOpen(false),
          },
        ]}
      >
        <div className="flex flex-col gap-sm-plus">
          <div className="flex items-center justify-between gap-sm text-caption text-[var(--color-text-secondary)]">
            <span>
              {questWidgetLoading
                ? 'Обновляем список…'
                : 'Прогресс обновляем автоматически — при необходимости обновите вручную'}
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-xs rounded-full border border-[rgba(0,217,255,0.35)] bg-[rgba(0,217,255,0.08)] px-sm py-xs text-label uppercase tracking-[0.08em] text-[var(--color-text-accent)] transition-all duration-150 focus-ring disabled:opacity-60"
              onClick={() => {
                if (!questsLoading) {
                  void loadQuests();
                }
              }}
              disabled={questsLoading}
            >
              {questsLoading ? 'Обновляем…' : 'Обновить'}
            </button>
          </div>

          {questsError && (
            <Card className="border-[rgba(255,51,51,0.35)] bg-[rgba(58,16,24,0.82)] text-[var(--color-text-primary)]">
              {questsError}
            </Card>
          )}

          {questWidgetLoading ? (
            <p className="text-caption text-[var(--color-text-secondary)]">
              Загружаем список заданий…
            </p>
          ) : quests.length === 0 ? (
            <p className="text-caption text-[var(--color-text-secondary)]">
              Новые задания появятся в ближайшее время.
            </p>
          ) : (
            <>
              {dailyQuests.length > 0 && (
                <div className="flex flex-col gap-sm">
                  <h3 className="m-0 text-caption uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Ежедневные
                  </h3>
                  {dailyQuests.map(quest => (
                    <QuestRow
                      key={quest.id}
                      quest={quest}
                      onClaim={handleQuestClaim}
                      claiming={claimingQuestId === quest.id}
                    />
                  ))}
                </div>
              )}

              {weeklyQuests.length > 0 && (
                <div className="flex flex-col gap-sm">
                  <h3 className="m-0 text-caption uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                    Еженедельные
                  </h3>
                  {weeklyQuests.map(quest => (
                    <QuestRow
                      key={quest.id}
                      quest={quest}
                      onClaim={handleQuestClaim}
                      claiming={claimingQuestId === quest.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </ModalBase>
    </>
  );
}

interface QuestRowProps {
  quest: QuestView;
  onClaim: (questId: string) => void;
  claiming: boolean;
}

function QuestRow({ quest, onClaim, claiming }: QuestRowProps) {
  const progressPercent =
    quest.target > 0 ? Math.min(100, Math.round((quest.progress / quest.target) * 100)) : 0;
  const remaining = Math.max(0, quest.target - quest.progress);
  const expiresAt = new Date(quest.expiresAt);
  const expiresLabel = expiresAt.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const rewardParts: string[] = [];
  if (quest.stars > 0) rewardParts.push(`⭐ ${quest.stars}`);
  if (quest.energy > 0) rewardParts.push(`⚡ ${formatNumberWithSpaces(quest.energy)}`);
  if (quest.xp > 0) rewardParts.push(`XP ${formatNumberWithSpaces(quest.xp)}`);
  const accentClass =
    quest.type === 'daily'
      ? 'from-[rgba(0,217,255,0.2)] to-[rgba(0,77,153,0.65)] border-[rgba(0,217,255,0.3)] shadow-glow'
      : 'from-[rgba(255,163,255,0.22)] to-[rgba(80,34,120,0.7)] border-[rgba(255,163,255,0.35)] shadow-glow-magenta';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accentClass} px-md py-sm-plus flex flex-col gap-sm`}
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_65%)]"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-sm">
        <div className="flex flex-col gap-xs">
          <span className="inline-flex items-center gap-xs rounded-full bg-[rgba(0,0,0,0.25)] px-sm py-xs text-label uppercase text-white/70">
            {quest.type === 'daily' ? 'Ежедневное задание' : 'Еженедельное задание'}
          </span>
          <p className="m-0 text-body font-semibold text-white">{quest.title}</p>
          {quest.description && (
            <p className="m-0 text-body-sm text-white/75">{quest.description}</p>
          )}
          <p className="m-0 text-micro uppercase tracking-[0.3px] text-white/55">
            Дедлайн: {quest.type === 'daily' ? 'конец дня' : 'понедельник'} · {expiresLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-xs min-w-[120px]">
          <span className="text-label uppercase text-white/60">Прогресс</span>
          <span className="text-title font-semibold text-white">{progressPercent}%</span>
          {quest.status === 'ready' ? (
            <Button
              size="sm"
              variant="primary"
              className="shadow-glow"
              onClick={() => onClaim(quest.id)}
              loading={claiming}
            >
              Забрать
            </Button>
          ) : (
            <span className="text-micro uppercase text-white/50">
              {remaining > 0
                ? `Осталось ${formatNumberWithSpaces(Math.floor(remaining))}`
                : quest.status === 'claimed'
                  ? 'Получено'
                  : 'В процессе'}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex flex-col gap-xs">
        <div className="h-3 rounded-full bg-[rgba(255,255,255,0.18)] shadow-inner overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-success)] to-[var(--color-gold)]"
            style={{ width: `${Math.max(progressPercent, 4)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-body-sm text-white/75">
          <span>
            {formatNumberWithSpaces(Math.floor(quest.progress))} /{' '}
            {formatNumberWithSpaces(Math.floor(quest.target))}
          </span>
          {remaining > 0 && <span>Осталось {formatNumberWithSpaces(Math.floor(remaining))}</span>}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-sm text-micro uppercase tracking-[0.3px] text-white/60">
        <span>{quest.type === 'daily' ? 'Daily' : 'Weekly'}</span>
        {rewardParts.length > 0 && <span>· Награда: {rewardParts.join(' + ')}</span>}
        <span>
          · Статус:{' '}
          {quest.status === 'claimed'
            ? 'Получено'
            : quest.status === 'ready'
              ? 'Готово'
              : 'Активно'}
        </span>
      </div>
    </div>
  );
}
