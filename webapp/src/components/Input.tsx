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
      'w-full border rounded-2xl bg-surface-glass-strong text-text-primary placeholder:text-text-secondary/75 transition-colors duration-150 focus:outline-none focus:border-accent-gold focus:bg-surface-glass-strong disabled:opacity-50 disabled:cursor-not-allowed shadow-elevation-1';

    const borderStyles = error
      ? 'border-feedback-error/70 focus:border-feedback-error'
      : 'border-border-cyan/60 focus:border-accent-gold';

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
        {error && errorMessage && <p className="text-micro text-feedback-error">{errorMessage}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
