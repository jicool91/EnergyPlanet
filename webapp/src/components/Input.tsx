import React from 'react';
import clsx from 'clsx';

/**
 * Input Component
 * Standardized text input with focus/invalid states
 * Uses design system colors
 */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Show error state
   */
  error?: boolean;

  /**
   * Error message to display below input
   */
  errorMessage?: string;

  /**
   * Input size
   */
  inputSize?: 'sm' | 'md' | 'lg';

  /**
   * Optional label
   */
  label?: string;
}

/**
 * Input Component
 *
 * @example
 * // Basic input
 * <Input placeholder="Enter text" />
 *
 * @example
 * // With label and error
 * <Input
 *   label="Username"
 *   error={hasError}
 *   errorMessage="Username is required"
 * />
 *
 * @example
 * // Large input with value
 * <Input
 *   size="lg"
 *   placeholder="Search..."
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 * />
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, error = false, errorMessage, inputSize = 'md', label, disabled, ...props },
    ref
  ) => {
    const sizeStyles = {
      sm: 'px-sm-plus py-xs-plus text-caption',
      md: 'px-md py-sm text-body',
      lg: 'px-md py-sm-plus text-body',
    };

    const baseStyles =
      'w-full border rounded-2xl bg-[rgba(12,18,40,0.82)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/75 transition-colors duration-150 focus:outline-none focus:border-[var(--color-text-accent)] focus:bg-[rgba(18,24,52,0.92)] disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation-1';

    const borderStyles = error
      ? 'border-[rgba(255,51,51,0.55)] focus:border-[var(--color-text-destructive)]'
      : 'border-[rgba(0,217,255,0.22)] focus:border-[var(--color-text-accent)]';

    return (
      <div className="flex flex-col gap-xs">
        {label && (
          <label className="text-caption font-semibold text-token-secondary">{label}</label>
        )}
        <input
          ref={ref}
          disabled={disabled}
          className={clsx(baseStyles, borderStyles, sizeStyles[inputSize], className)}
          {...props}
        />
        {error && errorMessage && (
          <p className="text-micro text-[var(--color-text-destructive)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
