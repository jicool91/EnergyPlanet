import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

/**
 * Button Component
 * Unified button with variants: primary, secondary, success, danger
 * Uses design system tokens
 */

const buttonVariants = cva(
  // Base classes: flex, center, text, cursor, transition
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-120 ease-in-out cursor-pointer disabled:opacity-60 disabled:cursor-default focus:outline-none',
  {
    variants: {
      variant: {
        // Primary: cyan gradient
        primary:
          'bg-gradient-to-br from-cyan/25 to-blue-500/35 text-white hover:shadow-glow disabled:shadow-none',

        // Secondary: cyan with less opacity
        secondary: 'bg-cyan/20 text-white hover:shadow-card-hover disabled:shadow-none',

        // Success: lime/gold gradient
        success:
          'bg-gradient-to-br from-lime/50 to-orange/50 text-dark-bg font-bold hover:shadow-lg disabled:shadow-none',

        // Danger: red
        danger: 'bg-red-error/80 text-white hover:shadow-lg disabled:shadow-none',

        // Ghost: text only
        ghost: 'bg-transparent text-cyan hover:text-cyan/80 disabled:text-white/40',
      },

      size: {
        // Small: compact button
        sm: 'px-3 py-1.5 text-caption rounded-sm',

        // Medium: default button
        md: 'px-4 py-2 text-caption rounded-md',

        // Large: prominent button
        lg: 'px-6 py-3 text-body rounded-lg',
      },

      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },

    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Show loading spinner
   */
  loading?: boolean;

  /**
   * Loading text to display
   */
  loadingText?: string;
}

/**
 * Button Component
 *
 * @example
 * // Primary button
 * <Button>Click me</Button>
 *
 * @example
 * // Secondary button with loading state
 * <Button variant="secondary" loading={isLoading} loadingText="Processing...">
 *   Submit
 * </Button>
 *
 * @example
 * // Large success button, full width
 * <Button variant="success" size="lg" fullWidth>
 *   Confirm
 * </Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      disabled,
      loading = false,
      loadingText,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {loading && (
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {loading ? loadingText || 'Loading...' : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
