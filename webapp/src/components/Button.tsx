import React from 'react';
import { motion, type Transition } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

/**
 * Button Component
 * Unified button with variants: primary, secondary, success, danger
 * Uses design system tokens
 */

const buttonVariants = cva(
  // Base classes: flex, center, text, cursor, transition
  'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-120 ease-in-out cursor-pointer disabled:opacity-60 disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--app-accent)] focus-visible:ring-offset-[var(--app-bg)]',
  {
    variants: {
      variant: {
        // Primary: cyan gradient
        primary:
          'btn-primary text-[var(--tg-theme-button-text-color)] shadow-none hover:shadow-glow disabled:shadow-none',

        // Secondary: cyan with less opacity
        secondary:
          'bg-[var(--app-card-bg)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] hover:brightness-110 hover:shadow-glow-card disabled:shadow-none',

        // Success: lime/gold gradient
        success:
          'bg-[var(--color-success)] text-[var(--color-surface-primary)] font-bold hover:brightness-110 hover:shadow-lg disabled:shadow-none',

        // Danger: red
        danger:
          'bg-[var(--color-text-destructive)] text-[var(--tg-theme-button-text-color)] hover:brightness-110 hover:shadow-lg disabled:shadow-none',

        // Ghost: text only
        ghost:
          'bg-transparent text-[var(--color-text-accent)] hover:text-[var(--tg-theme-link-color)] disabled:text-[var(--color-text-secondary)]',
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

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
>;

export interface ButtonProps extends NativeButtonProps, VariantProps<typeof buttonVariants> {
  /**
   * Show loading spinner
   */
  loading?: boolean;

  /**
   * Loading text to display
   */
  loadingText?: string;

  /**
   * Success state - shows checkmark and success color
   */
  success?: boolean;

  /**
   * Error state - triggers shake animation
   */
  error?: boolean;

  /**
   * Success message to display
   */
  successText?: string;
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
// Shake animation for error state
const shakeAnimation = {
  x: [0, -8, 8, -8, 8, 0],
};

const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  duration: 0.2,
};

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
      success = false,
      error = false,
      successText,
      children,
      ...props
    },
    ref
  ) => {
    // Determine button state for styling
    const buttonVariant = success ? 'success' : error ? 'danger' : variant;
    const isDisabled = disabled || loading || success;
    const errorTransition: Transition | undefined = error
      ? { duration: 0.4, ease: 'easeInOut' }
      : undefined;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={clsx(buttonVariants({ variant: buttonVariant, size, fullWidth }), className)}
        // Micro-interactions: hover and tap animations
        initial={{ scale: 1 }}
        whileHover={!isDisabled ? { scale: 1.05 } : { scale: 1 }}
        whileTap={!isDisabled ? { scale: 0.95 } : { scale: 1 }}
        animate={error ? shakeAnimation : { x: 0 }}
        transition={error ? errorTransition : springTransition}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <path
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </motion.svg>
        )}

        {/* Success checkmark */}
        {success && !loading && (
          <motion.svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}

        {/* Button text */}
        <motion.span
          animate={{
            opacity: loading ? 0.7 : success ? 0.9 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {loading ? loadingText || 'Loading...' : success ? successText || 'Success!' : children}
        </motion.span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
