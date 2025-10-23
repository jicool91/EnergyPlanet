/**
 * XP Progress Card Component
 * Shows XP progress towards next level with detailed breakdown
 *
 * Features:
 * - Large progress bar with gradient
 * - Level number and XP counts
 * - Remaining XP display
 * - Helper text for next action
 * - Compact and readable design
 *
 * Usage:
 * ```tsx
 * <XPProgressCard
 *   level={15}
 *   xpProgress={0.65}
 *   xpCurrent={650}
 *   xpTotal={1000}
 *   xpRemaining={350}
 * />
 * ```
 */

import { useMemo } from 'react';
import { Card } from './Card';
import { formatNumberWithSpaces } from '../utils/number';

interface XPProgressCardProps {
  level: number;
  xpProgress: number; // 0-1
  xpCurrent: number;
  xpTotal: number;
  xpRemaining: number;
}

export function XPProgressCard({
  level,
  xpProgress,
  xpCurrent,
  xpTotal,
  xpRemaining,
}: XPProgressCardProps) {
  const percentage = useMemo(() => Math.min(100, Math.max(0, xpProgress * 100)), [xpProgress]);
  const xpCurrentFormatted = useMemo(() => formatNumberWithSpaces(Math.max(0, xpCurrent)), [xpCurrent]);
  const xpTotalFormatted = useMemo(() => formatNumberWithSpaces(Math.max(0, xpTotal)), [xpTotal]);
  const xpRemainingFormatted = useMemo(() => formatNumberWithSpaces(Math.max(0, xpRemaining)), [xpRemaining]);

  const helperText = useMemo(() => {
    if (xpRemaining <= 0) {
      return 'Уровень готов к апгрейду — загляните в Постройки или Boost Hub';
    }
    if (xpRemaining > 1000000) {
      return `Долгий путь впереди — около ${(xpRemaining / 3600).toFixed(1)}ч пассивного дохода`;
    }
    return `Осталось ${xpRemainingFormatted} XP для следующего уровня`;
  }, [xpRemaining, xpRemainingFormatted]);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="m-0 text-xs uppercase tracking-[0.6px] text-white/45">
            Прогресс уровня
          </p>
          <h3 className="m-0 text-lg font-semibold text-white">Уровень {level}</h3>
        </div>
        <div className="text-right">
          <p className="m-0 text-xs text-white/60">Прогресс</p>
          <p className="m-0 text-sm font-semibold text-cyan">{Math.round(percentage)}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="h-3 rounded-full bg-white/10 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan via-lime to-gold transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-xs text-white/60">
          {xpCurrentFormatted} / {xpTotalFormatted} XP
        </div>
      </div>

      {/* Helper text */}
      <div className="text-xs text-white/50 leading-relaxed">
        {helperText}
      </div>
    </Card>
  );
}
