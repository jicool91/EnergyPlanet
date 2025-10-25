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
      sm: 'px-3 py-1.5 text-caption',
      md: 'px-4 py-2 text-body',
      lg: 'px-4 py-3 text-body',
    };

    const baseStyles =
      'w-full border rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]/80 transition-colors duration-150 focus:outline-none focus:border-[var(--color-text-accent)] focus:bg-[var(--color-surface-tertiary)] bg-[var(--color-surface-secondary)] disabled:opacity-50 disabled:cursor-not-allowed';

    const borderStyles = error
      ? 'border-[var(--color-text-destructive)]/60 focus:border-[var(--color-text-destructive)]'
      : 'border-[var(--color-border-subtle)] focus:border-[var(--color-text-accent)]';

    return (
      <div className="flex flex-col gap-1">
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
