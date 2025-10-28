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

import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { StatCard } from './StatCard';
import { XPProgressCard } from './XPProgressCard';
import { SocialProofCard } from './SocialProofCard';
import { DailyRewardBanner } from './DailyRewardBanner';
import { useDevicePerformance } from '../hooks';
import { formatNumberWithSpaces, formatCompactNumber } from '../utils/number';
import { PrestigeCard } from './PrestigeCard';
import { Button } from './Button';
import { logClientEvent } from '@/services/telemetry';
import { useQuestStore, type QuestView } from '@/store/questStore';
import { useShallow } from 'zustand/react/shallow';
import { canShowCap, consumeCap } from '@/utils/frequencyCap';

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
}: HomePanelProps) {
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
  const performance = useDevicePerformance();
  const isLowPerformance = performance === 'low';
  const isMediumPerformance = performance === 'medium';
  const hoverAnimation = isLowPerformance ? undefined : { scale: 1.05 };
  const tapAnimation = isLowPerformance ? { scale: 0.98 } : { scale: 0.95 };
  const glowClassName = isLowPerformance
    ? 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-12 -z-10'
    : 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-20 blur-xl -z-10';
  const hasLoggedMonetizationPromptRef = useRef(false);
  const [, setMonetizationCapRevision] = useState(0);
  const monetizationCapAllowed = canShowCap('home_monetization_prompt', { limit: 3 });
  const starsShort = useMemo(() => formatCompactNumber(Math.floor(stars)), [stars]);

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
    <div className="flex h-full flex-col lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-lg lg:px-lg lg:py-md">
      {/* Left column: stats + tap CTA */}
      <div className="flex flex-col h-full">
        {/* Top: Essential Stats (responsive grid) */}
        <div className="grid grid-cols-2 gap-sm px-md py-sm lg:px-0 lg:grid-cols-2 xl:grid-cols-4">
          {/* Essential Stats */}
          <StatCard icon="⚡" label="Энергия" value={`${energyCompact} E`} subLabel="Баланс" />
          <StatCard
            icon="🪐"
            label="Уровень тапа"
            value={`Ур. ${tapLevel}`}
            subLabel={`${tapIncomeDisplay} E`}
          />
          <StatCard
            icon="💤"
            label="Пассив"
            value={passiveIncomeLabel}
            subLabel={multiplierLabel}
          />
          <StatCard
            icon="🎯"
            label="Прогресс уровня"
            value={`${Math.round(xpProgress * 100)}%`}
            subLabel={xpRemaining > 0 ? `+${formatNumberWithSpaces(xpRemaining)} XP` : 'Готов'}
          />
          <StatCard icon="⭐" label="Stars" value={`${starsShort} ⭐`} subLabel="Для ускорений" />
        </div>

        {onViewAchievements && (
          <div className="flex justify-end px-md -mt-sm">
            <Button
              variant="secondary"
              size="sm"
              onClick={onViewAchievements}
              className="flex items-center gap-xs"
            >
              <span aria-hidden="true">🏆</span>
              Достижения
              {claimableAchievements > 0 && (
                <span className="ml-xs px-xs-plus py-0.5 rounded-full bg-[var(--color-accent)] text-black text-xs font-semibold">
                  +{claimableAchievements}
                </span>
              )}
            </Button>
          </div>
        )}

        {showMonetizationPrompt && purchaseInsight && (
          <Card className="mx-md mt-sm bg-[var(--color-surface-secondary)] border-[var(--color-border-subtle)]">
            <div className="flex flex-col gap-xs">
              <p className="m-0 text-sm font-semibold text-[var(--color-text-primary)]">
                Ускорь {purchaseInsight.name}
              </p>
              <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                Осталось{' '}
                {formatNumberWithSpaces(Math.max(0, Math.ceil(purchaseInsight.remaining ?? 0)))} E.
                У тебя ⭐ {formatNumberWithSpaces(Math.max(0, Math.floor(stars)))} — докупи Stars,
                чтобы закончить быстрее.
              </p>
              <Button size="sm" variant="primary" onClick={handleMonetizationClick}>
                🛍️ Перейти в магазин
              </Button>
            </div>
          </Card>
        )}

        <Card className="mx-md mt-sm bg-[var(--color-surface-secondary)] border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between gap-sm">
            <div>
              <p className="m-0 text-sm font-semibold text-[var(--color-text-primary)]">Задания</p>
              <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                Выполни квесты и получи дополнительные бонусы
              </p>
            </div>
            {questsError && (
              <span className="text-xs text-[var(--color-text-destructive)]">{questsError}</span>
            )}
          </div>
          {questWidgetLoading ? (
            <div className="mt-sm text-xs text-[var(--color-text-secondary)]">
              Загружаем задания…
            </div>
          ) : (
            <div className="mt-sm flex flex-col gap-sm">
              {dailyQuests.slice(0, 2).map(quest => (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  onClaim={handleQuestClaim}
                  claiming={claimingQuestId === quest.id}
                />
              ))}
              {weeklyQuests.slice(0, 1).map(quest => (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  onClaim={handleQuestClaim}
                  claiming={claimingQuestId === quest.id}
                />
              ))}
              {dailyQuests.length + weeklyQuests.length === 0 && !questsLoading && (
                <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                  Новые задания появятся в ближайшее время.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Center: BIG TAP BUTTON */}
        <div className="relative flex flex-1 items-center justify-center px-md py-sm-plus lg:px-0">
          {streakCount > 0 && (
            <motion.div
              className={`pointer-events-none absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 flex items-center gap-sm rounded-full px-sm-plus py-xs-plus border shadow-lg backdrop-blur bg-gradient-to-r ${
                isCriticalStreak
                  ? 'from-red-500/85 to-orange-400/85 border-red-400/70'
                  : 'from-cyan/80 to-lime/70 border-cyan/60'
              }`}
              animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }}
              transition={{ duration: isCriticalStreak ? 1.2 : 1.8, repeat: Infinity }}
            >
              <span className="text-lg" aria-hidden="true">
                🔥
              </span>
              <span className="text-sm font-semibold text-black drop-shadow">×{streakCount}</span>
              <span className="text-[11px] font-medium text-black/80 drop-shadow">
                Лучшее {bestStreak}
              </span>
            </motion.div>
          )}
          <motion.button
            onClick={onTap}
            whileTap={tapAnimation}
            whileHover={hoverAnimation}
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-cyan via-lime to-gold text-black font-bold text-4xl md:text-5xl shadow-2xl border-2 border-cyan/50 hover:border-cyan transition-all duration-300 active:scale-95 focus-ring"
            aria-label="Tap to generate energy"
            data-test-id="tap-button"
          >
            {/* Glow effect */}
            <motion.div
              className={glowClassName}
              animate={
                isLowPerformance
                  ? undefined
                  : {
                      scale: [1, isMediumPerformance ? 1.1 : 1.2, 1],
                      opacity: [0.15, 0.28, 0.15],
                    }
              }
              transition={
                isLowPerformance
                  ? undefined
                  : {
                      duration: isMediumPerformance ? 2.4 : 2,
                      repeat: Infinity,
                    }
              }
            />

            {/* Tap indicator */}
            <span role="img" aria-label="Tap planet to generate energy">
              🌍
            </span>
          </motion.button>
        </div>
      </div>

      {/* Right column: Progress & social blocks */}
      <div className="flex flex-col gap-sm px-md py-sm lg:px-0 lg:py-0">
        <div className="px-xs lg:px-0">
          <h2 className="m-0 text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-[0.12em]">
            Возвращайтесь каждый день
          </h2>
          <p className="m-0 mt-1 text-xs text-[var(--color-text-secondary)]">
            Заберите ежедневную награду и откройте Boost Hub, чтобы ускорить следующее повышение
            уровня.
          </p>
        </div>
        {/* Daily Reward Banner */}
        <DailyRewardBanner onOpenBoosts={onViewBoosts} onOpenShop={onOpenShop} />
        {activeBoost ? (
          <Card className="flex items-center justify-between gap-sm-plus bg-lime/15 border-lime/40">
            <div>
              <p className="m-0 text-xs uppercase tracking-[0.3em] text-lime-600">Активный буст</p>
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
              <p className="m-0 text-xs uppercase tracking-[0.3em] text-cyan-600">
                {nextBoostAvailabilityMs === 0 ? 'Буст доступен' : 'Следующий буст'}
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

        {/* XP Progress Card */}
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

        {/* Social Proof (Friends Playing) */}
        <SocialProofCard
          friendsCount={socialPlayerCount}
          isLoading={isSocialBlockLoading}
          onViewLeaderboard={onViewLeaderboard}
        />

        {/* Next Goal Card */}
        {purchaseInsight && (
          <Card highlighted={purchaseInsight.affordable}>
            <div className="mb-sm-plus flex items-center justify-between gap-sm-plus">
              <div>
                <p className="m-0 text-xs uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
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
      </div>
    </div>
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
