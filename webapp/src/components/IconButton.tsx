import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';
import { ACTION_TONE_STYLES } from './ui/actionTheme';

const iconVariantStyles = {
  primary: ACTION_TONE_STYLES.primary.icon,
  secondary: ACTION_TONE_STYLES.secondary.icon,
  success: ACTION_TONE_STYLES.success.icon,
  danger: ACTION_TONE_STYLES.danger.icon,
  ghost: ACTION_TONE_STYLES.ghost.icon,
};

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:cursor-not-allowed disabled:opacity-55',
  {
    variants: {
      variant: iconVariantStyles,
      size: {
        sm: 'h-10 w-10',
        md: 'h-12 w-12',
        lg: 'h-14 w-14',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

type IconButtonBaseProps = Omit<HTMLMotionProps<'button'>, 'children'>;

export interface IconButtonProps
  extends IconButtonBaseProps,
    VariantProps<typeof iconButtonVariants> {
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant, size, className, ...rest }, ref) => {
    const reduceMotion = useAppReducedMotion();

    return (
      <motion.button
        ref={ref}
        className={clsx(iconButtonVariants({ variant, size }), className)}
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
        {...rest}
      >
        {icon}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';
