import { memo, useMemo } from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';
import { useGyroscope } from '@/hooks/useGyroscope';
import { OptimizedImage } from '../OptimizedImage';

interface TapCircleProps {
  onTap: () => void;
  streakCount: number;
  tapLevel: number;
  boostMultiplier: number;
  isCriticalStreak: boolean;
  disabled?: boolean;
  planetAssetUrl?: string | null;
  planetName?: string;
}

export const TapCircle = memo(function TapCircle({
  onTap,
  streakCount,
  tapLevel,
  boostMultiplier,
  isCriticalStreak,
  disabled = false,
  planetAssetUrl,
  planetName,
}: TapCircleProps) {
  const reduceMotion = useAppReducedMotion();
  const gyroscope = useGyroscope({ enabled: !disabled, refreshRate: 60 });

  const gyroOffset = useMemo(() => {
    if (!gyroscope || reduceMotion) {
      return { x: 0, y: 0 };
    }

    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
    const x = clamp(gyroscope.y * 6, 10);
    const y = clamp(-gyroscope.x * 6, 10);
    return { x, y };
  }, [gyroscope, reduceMotion]);

  const hasPlanetImage = Boolean(planetAssetUrl);
  const glowAnimation =
    reduceMotion || hasPlanetImage
      ? undefined
      : {
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.28, 0.12],
          x: gyroOffset.x * 0.4,
          y: gyroOffset.y * 0.4,
          transition: {
            duration: isCriticalStreak ? 1.2 : 1.8,
            repeat: Infinity,
          },
        };

  const buttonClassName = clsx(
    'relative flex h-40 w-40 flex-col items-center justify-center rounded-full text-display font-semibold transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
    disabled ? 'cursor-not-allowed opacity-70' : 'hover:scale-105 active:scale-95',
    hasPlanetImage
      ? 'bg-surface-primary text-text-primary border border-border-layer-strong shadow-elevation-3'
      : 'bg-gradient-to-br from-accent-gold via-accent-gold-light to-accent-gold text-text-inverse shadow-glow-gold'
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        type="button"
        className={buttonClassName}
        onClick={disabled ? undefined : onTap}
        disabled={disabled}
        aria-label="Тапнуть планету, чтобы добыть энергию"
        animate={!reduceMotion && !disabled ? { x: gyroOffset.x, y: gyroOffset.y } : { x: 0, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18, mass: 0.6 }}
      >
        {!reduceMotion && !hasPlanetImage && (
          <motion.div
            className="absolute inset-[-12%] rounded-full bg-gradient-soft blur-3xl"
            animate={glowAnimation}
          />
        )}
        {planetAssetUrl ? (
          <OptimizedImage
            src={planetAssetUrl}
            alt={planetName ?? 'Planet skin'}
            width={152}
            height={152}
            className="h-32 w-32 rounded-full object-cover"
          />
        ) : (
          <span role="img" aria-hidden="true">
            🌍
          </span>
        )}
        <span className="mt-1 text-body font-semibold">Tap!</span>
      </motion.button>

      <div className="flex items-center gap-3 text-body text-text-secondary">
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
