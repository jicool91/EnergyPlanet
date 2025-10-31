import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import clsx from 'clsx';

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
  const reduceMotion = useReducedMotion();
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
        <div className="flex items-center justify-between text-caption text-[var(--color-text-secondary)]">
          <span>{label}</span>
          {showValue && <span>{percentage}%</span>}
        </div>
      )}
      <div
        className={clsx(
          'relative overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(32,35,44,0.75)]',
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
            'absolute inset-y-0 left-0 bg-[var(--color-accent-gold)] shadow-[0_12px_24px_rgba(243,186,47,0.35)]',
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
