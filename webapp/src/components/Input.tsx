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
      'w-full bg-dark-tertiary border rounded-md text-white placeholder-white/40 transition-colors duration-150 focus:outline-none focus:border-cyan focus:bg-dark-secondary disabled:opacity-50 disabled:cursor-not-allowed';

    const borderStyles = error
      ? 'border-red-error/60 focus:border-red-error'
      : 'border-cyan/[0.12] focus:border-cyan/60';

    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-caption font-semibold text-white/80">{label}</label>}
        <input
          ref={ref}
          disabled={disabled}
          className={clsx(baseStyles, borderStyles, sizeStyles[inputSize], className)}
          {...props}
        />
        {error && errorMessage && <p className="text-micro text-red-error">{errorMessage}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
