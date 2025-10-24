/**
 * Tap Section Component
 * Centered big tap button with glow effect
 *
 * Features:
 * - Large interactive tap button
 * - Glow animation effect
 * - Responsive scaling (mobile-first)
 * - Hover and tap animations
 *
 * Usage:
 * ```tsx
 * <TapSection onTap={handleTap} />
 * ```
 */

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useSafeArea, useDevicePerformance } from '../hooks';

interface TapSectionProps {
  onTap: () => void;
}

export function TapSection({ onTap }: TapSectionProps) {
  const { safeArea, viewport } = useSafeArea();
  const performance = useDevicePerformance();
  const isLowPerformance = performance === 'low';
  const isMediumPerformance = performance === 'medium';
  const { top: contentTop, bottom: contentBottom } = safeArea.content;

  const isLandscape = useMemo(() => {
    if (viewport.width !== null && viewport.height !== null) {
      return viewport.width > viewport.height;
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia?.('(orientation: landscape)').matches ?? false;
    }
    return false;
  }, [viewport.width, viewport.height]);

  const minHeight = useMemo(() => {
    const baseHeight = viewport.stableHeight ?? viewport.height;
    if (typeof baseHeight !== 'number') {
      return undefined;
    }
    const contentCut = safeArea.content.top + safeArea.content.bottom;
    const usable = Math.max(baseHeight - contentCut, 0);
    return usable > 0 ? `${usable}px` : undefined;
  }, [viewport.stableHeight, viewport.height, safeArea.content.bottom, safeArea.content.top]);

  const contentPadding = useMemo(() => {
    return {
      paddingTop: `${Math.max(0, contentTop) + 16}px`,
      paddingBottom: `${Math.max(0, contentBottom) + 16}px`,
    };
  }, [contentBottom, contentTop]);
  const buttonSizeClass = isLandscape ? 'w-28 h-28 md:w-32 md:h-32' : 'w-32 h-32 md:w-40 md:h-40';
  const hoverAnimation = isLowPerformance ? undefined : { scale: 1.05 };
  const tapAnimation = isLowPerformance ? { scale: 0.98 } : { scale: 0.95 };
  const glowClassName = isLowPerformance
    ? 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-12 -z-10'
    : 'absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-20 blur-xl -z-10';

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center p-4 w-full"
      style={{
        minHeight,
        ...contentPadding,
      }}
    >
      <motion.button
        onClick={onTap}
        whileTap={tapAnimation}
        whileHover={hoverAnimation}
        className={`relative ${buttonSizeClass} rounded-full bg-gradient-to-br from-cyan via-lime to-gold text-black font-bold text-4xl md:text-5xl shadow-2xl border-2 border-cyan/50 hover:border-cyan transition-all duration-300 active:scale-95 focus-ring`}
        aria-label="Tap to generate energy"
        type="button"
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
  );
}
