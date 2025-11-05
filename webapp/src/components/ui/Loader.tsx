import clsx from 'clsx';
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { type ActionTone } from './actionTheme';

export type LoaderSize = 'sm' | 'md' | 'lg';

export interface LoaderProps extends HTMLAttributes<HTMLSpanElement> {
  size?: LoaderSize;
  tone?: ActionTone;
  label?: string;
  inline?: boolean;
}

const SIZE_CLASS: Record<LoaderSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const TONE_TEXT_CLASS: Record<ActionTone, string> = {
  primary: 'text-accent-gold',
  secondary: 'text-text-secondary',
  success: 'text-feedback-success',
  danger: 'text-feedback-error',
  ghost: 'text-text-accent',
};

export const Loader = forwardRef<HTMLSpanElement, LoaderProps>(
  ({ className, size = 'md', tone = 'primary', label, inline = false, ...rest }, ref) => {
    const spinnerClass = clsx('animate-spin', SIZE_CLASS[size], TONE_TEXT_CLASS[tone]);
    const containerClass = clsx(
      'inline-flex items-center gap-sm text-text-secondary',
      inline ? undefined : 'justify-center',
      className
    );
    const ariaLabel = label ?? 'Loading';

    return (
      <span
        ref={ref}
        className={containerClass}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel}
        {...rest}
      >
        <svg className={spinnerClass} viewBox="0 0 24 24" aria-hidden="true">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {label ? <span className="text-caption text-text-secondary">{label}</span> : null}
      </span>
    );
  }
);

Loader.displayName = 'Loader';
