import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl transition-transform duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary disabled:cursor-not-allowed disabled:opacity-55',
  {
    variants: {
      variant: {
        primary:
          'bg-accent-gold text-text-inverse shadow-glow-gold hover:brightness-105 active:scale-[0.97]',
        secondary:
          'border border-border-layer bg-layer-strong text-text-primary hover:border-border-layer-strong hover:bg-layer-elevated hover:shadow-elevation-2 active:scale-[0.97]',
        ghost:
          'bg-transparent text-text-primary hover:bg-layer-overlay-ghost-soft active:scale-[0.97]',
      },
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
