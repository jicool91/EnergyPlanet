import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
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
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:cursor-not-allowed disabled:opacity-55 data-[loading=true]:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-accent-gold text-text-inverse shadow-glow-gold hover:brightness-105 active:scale-[0.97]',
        secondary:
          'border border-border-layer bg-layer-strong text-text-primary hover:border-border-layer-strong hover:bg-layer-elevated hover:shadow-elevation-2 active:scale-[0.97]',
        success:
          'bg-feedback-success text-text-inverse shadow-glow-lime hover:brightness-105 active:scale-[0.97]',
        danger:
          'bg-feedback-error text-text-inverse shadow-lg hover:brightness-110 active:scale-[0.97]',
        ghost: 'bg-transparent text-text-accent hover:text-text-primary active:scale-[0.97]',
      },

      size: {
        sm: 'h-10 min-w-[88px] rounded-xl px-4 text-caption',
        md: 'h-12 min-w-[104px] rounded-2xl px-5 text-body',
        lg: 'h-14 min-w-[120px] rounded-3xl px-6 text-body',
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
  ButtonHTMLAttributes<HTMLButtonElement>,
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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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

    const resolvedType = props.type ?? 'button';

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
        data-loading={loading}
        aria-busy={loading || undefined}
        aria-live={success || error ? 'polite' : undefined}
        type={resolvedType}
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
