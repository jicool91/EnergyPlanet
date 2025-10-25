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

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const percentage = useMemo(() => Math.min(100, Math.max(0, xpProgress * 100)), [xpProgress]);
  const xpCurrentFormatted = useMemo(
    () => formatNumberWithSpaces(Math.max(0, xpCurrent)),
    [xpCurrent]
  );
  const xpTotalFormatted = useMemo(() => formatNumberWithSpaces(Math.max(0, xpTotal)), [xpTotal]);
  const xpRemainingFormatted = useMemo(
    () => formatNumberWithSpaces(Math.max(0, xpRemaining)),
    [xpRemaining]
  );

  const helperText = useMemo(() => {
    if (xpRemaining <= 0) {
      return 'Уровень готов к апгрейду — загляните в Постройки или Boost Hub';
    }
    if (xpRemaining > 1000000) {
      return `Долгий путь впереди — около ${(xpRemaining / 3600).toFixed(1)}ч пассивного дохода`;
    }
    return `Осталось ${xpRemainingFormatted} XP для следующего уровня`;
  }, [xpRemaining, xpRemainingFormatted]);

  const shouldAnimate = !prefersReducedMotion && isVisible;

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.target === node) {
            setIsVisible(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Card ref={containerRef}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="m-0 text-xs uppercase tracking-[0.6px] text-[var(--color-text-secondary)]">
            Прогресс уровня
          </p>
          <h3 className="m-0 text-lg font-semibold text-token-primary">Уровень {level}</h3>
        </div>
        <div className="text-right">
          <p className="m-0 text-xs text-token-secondary">Прогресс</p>
          <p className="m-0 text-sm font-semibold text-cyan">{Math.round(percentage)}%</p>
        </div>
      </div>

      {/* Progress bar with animation */}
      <div className="mb-3">
        <div
          className="h-3 rounded-full overflow-hidden mb-2 relative"
          style={{ background: 'color-mix(in srgb, var(--color-border-subtle) 35%, transparent)' }}
        >
          {/* Animated fill */}
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan via-lime to-gold"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={
              shouldAnimate
                ? { type: 'spring', stiffness: 100, damping: 25, duration: 0.6 }
                : { duration: 0 }
            }
          />

          {/* Shimmer effect overlay */}
          <motion.div
            className="absolute inset-0 h-full rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
            animate={
              shouldAnimate
                ? {
                    x: ['0%', '200%'],
                    opacity: [0, 0.3, 0],
                  }
                : { opacity: 0 }
            }
            transition={
              shouldAnimate
                ? {
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.5,
                  }
                : { duration: 0 }
            }
            style={{ width: '100%' }}
          />
        </div>
        <div className="text-xs text-token-secondary">
          {xpCurrentFormatted} / {xpTotalFormatted} XP
        </div>
      </div>

      {/* Helper text */}
      <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{helperText}</div>
    </Card>
  );
}
