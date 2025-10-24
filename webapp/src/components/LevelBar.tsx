/**
 * Compact Level Bar Component
 * Thin XP progress bar for header or footer
 *
 * Features:
 * - Thin progress bar (2px height)
 * - Smooth animation
 * - Gradient from cyan to lime to gold
 * - Optional tooltip on hover showing "N/X XP"
 * - Responsive design
 *
 * Usage:
 * ```tsx
 * <LevelBar
 *   progress={0.65}
 *   xpCurrent={650}
 *   xpTotal={1000}
 * />
 * ```
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatNumberWithSpaces } from '../utils/number';

interface LevelBarProps {
  progress: number; // 0-1
  xpCurrent?: number;
  xpTotal?: number;
  showLabel?: boolean;
}

export function LevelBar({ progress, xpCurrent, xpTotal, showLabel = false }: LevelBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const tooltip = useMemo(() => {
    if (!xpCurrent || !xpTotal) return null;
    return `${formatNumberWithSpaces(Math.floor(xpCurrent))} / ${formatNumberWithSpaces(Math.floor(xpTotal))} XP`;
  }, [xpCurrent, xpTotal]);

  const percentage = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      className="relative w-full group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={tooltip || undefined}
    >
      {/* Progress bar container */}
      <div className="h-0.5 w-full bg-white/5 overflow-hidden relative">
        {/* Animated progress fill */}
        <motion.div
          className="h-full bg-gradient-to-r from-cyan via-lime to-gold"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, duration: 0.8 }}
        />

        {/* Shimmer effect for thin bar */}
        <motion.div
          className="absolute inset-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
          animate={{
            x: ['-100%', '100%'],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: 0.3,
          }}
        />
      </div>

      {/* Optional tooltip on hover */}
      {showTooltip && tooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none z-50">
          {tooltip}
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-black/90" />
        </div>
      )}

      {/* Optional label */}
      {showLabel && (
        <div className="text-xs text-white/60 mt-1">{Math.round(percentage)}% to next level</div>
      )}
    </div>
  );
}
