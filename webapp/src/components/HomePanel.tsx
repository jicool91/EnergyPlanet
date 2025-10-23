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
import { formatNumberWithSpaces, formatCompactNumber } from '../utils/number';

export interface HomePanelProps {
  // Game state
  energy: number;
  level: number;
  xpProgress: number; // 0-1
  xpProgressLabel: string; // "50/200 XP"
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
  xpProgressLabel,
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

  return (
    <div className="flex flex-col h-full">
      {/* Top: Essential Stats (2-column layout) */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {/* Essential Stats */}
        <StatCard
          icon="⚡"
          label="Энергия"
          value={`${energyCompact} E`}
          subLabel="Баланс"
        />
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

      {/* Streak indicator (only if active) */}
      {streakCount > 0 && (
        <div className="px-4 grid grid-cols-2 gap-3">
          <StatCard
            icon="🔥"
            label="Комбо"
            value={`×${streakCount}`}
            subLabel={`Лучшее: ${bestStreak}`}
            tone={isCriticalStreak ? 'positive' : 'default'}
          />
        </div>
      )}

      {/* Center: BIG TAP BUTTON */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.button
          onClick={onTap}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-cyan via-lime to-gold text-black font-bold text-4xl md:text-5xl shadow-2xl border-2 border-cyan/50 hover:border-cyan transition-all duration-300 active:scale-95"
          aria-label="Tap to generate energy"
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-20 blur-xl -z-10"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          {/* Tap indicator */}
          🌍
        </motion.button>
      </div>

      {/* Bottom: XP Progress + Next Goal (scrollable if needed) */}
      <div className="flex flex-col gap-4 p-4 overflow-y-auto">
        {/* XP Progress Bar */}
        <Card>
          <div className="flex items-center justify-between gap-3 mb-3">
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
          <div className="text-xs text-white/60 mt-2">
            {xpRemaining > 0
              ? `Осталось ${formatNumberWithSpaces(Math.max(0, xpRemaining))} XP`
              : 'Уровень готов к апгрейду — загляните в Постройки или Boost Hub'}
          </div>
        </Card>

        {/* Next Goal Card */}
        {purchaseInsight && (
          <Card highlighted={purchaseInsight.affordable}>
            <div className="flex items-center justify-between gap-3 mb-2">
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
            {purchaseInsight.remaining > 0 && (
              <div className="text-sm text-white/60 mt-1">
                Осталось: {formatNumberWithSpaces(Math.floor(purchaseInsight.remaining))} E
              </div>
            )}
            {purchaseInsight.paybackSeconds !== undefined &&
              purchaseInsight.paybackSeconds !== null && (
                <div className="text-xs text-white/50 mt-1">
                  Окупаемость: {(purchaseInsight.paybackSeconds / 3600).toFixed(1)} часов
                </div>
              )}
          </Card>
        )}
      </div>
    </div>
  );
}
