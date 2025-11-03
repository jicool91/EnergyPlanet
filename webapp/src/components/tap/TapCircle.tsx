import { memo } from 'react';
import { motion } from 'framer-motion';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';

interface TapCircleProps {
  onTap: () => void;
  streakCount: number;
  tapLevel: number;
  boostMultiplier: number;
  isCriticalStreak: boolean;
  disabled?: boolean;
}

export const TapCircle = memo(function TapCircle({
  onTap,
  streakCount,
  tapLevel,
  boostMultiplier,
  isCriticalStreak,
  disabled = false,
}: TapCircleProps) {
  const reduceMotion = useAppReducedMotion();
  const glowAnimation = reduceMotion
    ? undefined
    : {
        scale: [1, 1.15, 1],
        opacity: [0.12, 0.28, 0.12],
        transition: {
          duration: isCriticalStreak ? 1.2 : 1.8,
          repeat: Infinity,
        },
      };

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        type="button"
        className={`relative flex h-40 w-40 flex-col items-center justify-center rounded-full bg-gradient-to-br from-accent-gold via-accent-gold-light to-accent-gold text-4xl font-semibold text-text-inverse shadow-glow-gold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary ${
          disabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 active:scale-95'
        }`}
        onClick={disabled ? undefined : onTap}
        disabled={disabled}
        aria-label="Тапнуть планету, чтобы добыть энергию"
      >
        {!reduceMotion && (
          <motion.div
            className="absolute inset-[-12%] rounded-full bg-gradient-soft blur-3xl"
            animate={glowAnimation}
          />
        )}
        <span role="img" aria-hidden="true">
          🌍
        </span>
        <span className="mt-1 text-base font-semibold">Tap!</span>
      </motion.button>

      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <span className="flex items-center gap-1 rounded-full border border-border-layer-strong px-3 py-1 text-text-primary shadow-elevation-2">
          <span aria-hidden="true">⚙️</span>
          Tap Lv {tapLevel}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-border-layer px-3 py-1 text-text-secondary">
          <span aria-hidden="true">🔥</span>
          Комбо {streakCount}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-border-layer px-3 py-1 text-text-secondary">
          <span aria-hidden="true">✨</span>
          Множитель ×{boostMultiplier.toFixed(2)}
        </span>
      </div>
    </div>
  );
});
