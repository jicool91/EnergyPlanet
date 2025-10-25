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

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { StatCard } from './StatCard';
import { XPProgressCard } from './XPProgressCard';
import { SocialProofCard } from './SocialProofCard';
import { DailyRewardBanner } from './DailyRewardBanner';
import { useDevicePerformance, useSafeArea } from '../hooks';
import { formatNumberWithSpaces, formatCompactNumber } from '../utils/number';

const TAB_BAR_RESERVE_PX = 88;

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
  streakCount: number;
  bestStreak: number;
  isCriticalStreak: boolean;

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
  streakCount,
  bestStreak,
  isCriticalStreak,
  purchaseInsight,
  onTap,
}: HomePanelProps) {
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
  const performance = useDevicePerformance();
  const isLowPerformance = performance === 'low';
  const isMediumPerformance = performance === 'medium';
  const { safeArea } = useSafeArea();
  const { top: contentTop, bottom: contentBottom } = safeArea.content;
  const panelPadding = useMemo(() => {
    return {
      paddingTop: `${Math.max(0, contentTop) + 12}px`,
      paddingBottom: `${Math.max(0, contentBottom) + TAB_BAR_RESERVE_PX}px`,
    };
  }, [contentBottom, contentTop]);
  const hoverAnimation = isLowPerformance ? undefined : { scale: 1.05 };
  const tapAnimation = isLowPerformance ? { scale: 0.98 } : { scale: 0.95 };
  const glowClassName = isLowPerformance
    ? 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-12 -z-10'
    : 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-20 blur-xl -z-10';

  return (
    <div
      className="flex flex-col h-full lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-6 lg:px-6 lg:py-4"
      style={panelPadding}
    >
      {/* Left column: stats + tap CTA */}
      <div className="flex flex-col h-full">
        {/* Top: Essential Stats (responsive grid) */}
        <div className="grid grid-cols-2 gap-2 px-4 py-2 lg:px-0 lg:grid-cols-2 xl:grid-cols-4">
          {/* Essential Stats */}
          <StatCard icon="⚡" label="Энергия" value={`${energyCompact} E`} subLabel="Баланс" />
          <StatCard
            icon="🪐"
            label="Tap Lvl"
            value={`Lv ${tapLevel}`}
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
            label="Уровень"
            value={`${Math.round(xpProgress * 100)}%`}
            subLabel={xpRemaining > 0 ? `+${formatNumberWithSpaces(xpRemaining)} XP` : 'Готов'}
          />
        </div>

        {/* Center: BIG TAP BUTTON */}
        <div className="relative flex-1 flex items-center justify-center py-3 px-4 lg:px-0">
          {streakCount > 0 && (
            <motion.div
              className={`pointer-events-none absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-3 py-1.5 border shadow-lg backdrop-blur bg-gradient-to-r ${
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
      <div className="flex flex-col gap-2 px-4 py-2 lg:px-0 lg:py-0">
        {/* Daily Reward Banner */}
        <DailyRewardBanner />

        {/* XP Progress Card */}
        <XPProgressCard
          level={level}
          xpProgress={xpProgress}
          xpCurrent={xpIntoLevel}
          xpTotal={xpIntoLevel + xpToNextLevel}
          xpRemaining={xpRemaining}
        />

        {/* Social Proof (Friends Playing) */}
        <SocialProofCard friendsCount={Math.floor(Math.random() * 50) + 5} />

        {/* Next Goal Card */}
        {purchaseInsight && (
          <Card highlighted={purchaseInsight.affordable}>
            <div className="flex items-center justify-between gap-3 mb-2">
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
