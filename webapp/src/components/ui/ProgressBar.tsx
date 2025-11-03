import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const ProgressBar = memo(function ProgressBar({
  value,
  max = 1,
  size = 'md',
  label,
  showValue = false,
  className,
}: ProgressBarProps) {
  const reduceMotion = useAppReducedMotion();
  const safeMax = max <= 0 ? 1 : max;
  const ratio = clamp(value / safeMax, 0, 1);
  const percentage = Math.round(ratio * 100);

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-2 rounded-xl',
          thumb: 'rounded-xl',
        };
      case 'md':
      default:
        return {
          container: 'h-[14px] rounded-2xl',
          thumb: 'rounded-2xl',
        };
    }
  }, [size]);

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {label && (
        <div className="flex items-center justify-between text-caption text-text-secondary">
          <span>{label}</span>
          {showValue && <span>{percentage}%</span>}
        </div>
      )}
      <div
        className={clsx(
          'relative overflow-hidden border border-border-layer bg-layer-soft',
          sizeClasses.container
        )}
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(safeMax)}
        aria-valuetext={showValue || !label ? `${percentage}%` : undefined}
      >
        <motion.div
          className={clsx(
            'absolute inset-y-0 left-0 bg-accent-gold shadow-glow-gold',
            sizeClasses.thumb
          )}
          initial={reduceMotion ? false : { width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
});
