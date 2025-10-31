import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reduceMotion = useReducedMotion();
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
        className={`relative flex h-40 w-40 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[rgba(243,186,47,0.85)] via-[rgba(250,210,88,0.95)] to-[rgba(243,186,47,1)] text-4xl font-semibold text-[var(--color-bg-primary)] shadow-[0_32px_64px_rgba(243,186,47,0.35)] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(243,186,47,0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] ${
          disabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 active:scale-95'
        }`}
        onClick={disabled ? undefined : onTap}
        disabled={disabled}
        aria-label="Тапнуть планету, чтобы добыть энергию"
      >
        {!reduceMotion && (
          <motion.div
            className="absolute inset-[-12%] rounded-full bg-[rgba(243,186,47,0.18)] blur-3xl"
            animate={glowAnimation}
          />
        )}
        <span role="img" aria-hidden="true">
          🌍
        </span>
        <span className="mt-1 text-base font-semibold">Tap!</span>
      </motion.button>

      <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.12)] px-3 py-1 text-[var(--color-text-primary)] shadow-[0_12px_24px_rgba(0,0,0,0.25)]">
          <span aria-hidden="true">⚙️</span>
          Tap Lv {tapLevel}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
          <span aria-hidden="true">🔥</span>
          Комбо {streakCount}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1">
          <span aria-hidden="true">✨</span>
          Множитель ×{boostMultiplier.toFixed(2)}
        </span>
      </div>
    </div>
  );
});
