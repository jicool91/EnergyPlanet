import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { motion, type Transition } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';
import { ACTION_TONE_STYLES } from './ui/actionTheme';

/**
 * Button Component
 * Unified button with variants: primary, secondary, success, danger
 * Uses design system tokens
 */

const buttonVariantStyles = {
  primary: ACTION_TONE_STYLES.primary.solid,
  secondary: ACTION_TONE_STYLES.secondary.solid,
  success: ACTION_TONE_STYLES.success.solid,
  danger: ACTION_TONE_STYLES.danger.solid,
  ghost: ACTION_TONE_STYLES.ghost.solid,
};

const buttonVariants = cva(
  // Base classes: flex, center, text, cursor, transition
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold text-center transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:cursor-not-allowed disabled:opacity-55 data-[loading=true]:pointer-events-none',
  {
    variants: {
      variant: {
        primary: buttonVariantStyles.primary,
        secondary: buttonVariantStyles.secondary,
        success: buttonVariantStyles.success,
        danger: buttonVariantStyles.danger,
        ghost: buttonVariantStyles.ghost,
      },

      size: {
        xs: 'h-8 min-w-[72px] rounded-lg px-3 text-caption',
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
    const reduceMotion = useAppReducedMotion();
    const errorTransition: Transition | undefined = error
      ? { duration: reduceMotion ? 0 : 0.4, ease: 'easeInOut' }
      : undefined;

    const resolvedType = props.type ?? 'button';
    const baseTransition = reduceMotion ? { duration: 0 } : springTransition;
    const hoverAnimation = !isDisabled && !reduceMotion ? { scale: 1.05 } : { scale: 1 };
    const tapAnimation = !isDisabled && !reduceMotion ? { scale: 0.95 } : { scale: 1 };
    const animateState = error && !reduceMotion ? shakeAnimation : { x: 0 };
    const transitionState = error && !reduceMotion ? errorTransition : baseTransition;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        className={clsx(buttonVariants({ variant: buttonVariant, size, fullWidth }), className)}
        // Micro-interactions: hover and tap animations
        initial={{ scale: 1 }}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        animate={animateState}
        transition={transitionState}
        data-loading={loading}
        aria-busy={loading || undefined}
        aria-live={success || error ? 'polite' : undefined}
        type={resolvedType}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.svg
            className={clsx('h-4 w-4', !reduceMotion && 'animate-spin')}
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={
              reduceMotion ? undefined : { duration: 1, repeat: Infinity, ease: 'linear' }
            }
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
