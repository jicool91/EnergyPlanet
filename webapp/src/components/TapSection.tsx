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
import { useSafeArea } from '../hooks';

interface TapSectionProps {
  onTap: () => void;
}

export function TapSection({ onTap }: TapSectionProps) {
  const { safeArea, viewport } = useSafeArea();

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

  const buttonSizeClass = isLandscape ? 'w-28 h-28 md:w-32 md:h-32' : 'w-32 h-32 md:w-40 md:h-40';

  return (
    <div
      className="flex flex-col flex-1 items-center justify-center p-4 w-full"
      style={{
        minHeight,
        paddingTop: 'calc(var(--tg-content-safe-area-top, 0px) + 16px)',
        paddingBottom: 'calc(var(--tg-content-safe-area-bottom, 0px) + 16px)',
      }}
    >
      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className={`relative ${buttonSizeClass} rounded-full bg-gradient-to-br from-cyan via-lime to-gold text-black font-bold text-4xl md:text-5xl shadow-2xl border-2 border-cyan/50 hover:border-cyan transition-all duration-300 active:scale-95 focus-ring`}
        aria-label="Tap to generate energy"
        type="button"
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
        <span role="img" aria-label="Tap planet to generate energy">
          🌍
        </span>
      </motion.button>
    </div>
  );
}
