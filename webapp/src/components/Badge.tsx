import React from 'react';
import clsx from 'clsx';

/**
 * Badge Component
 * Small labels for rarity, status, tags
 * Uses design system with rarity-based colors
 */

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'epic'
  | 'legendary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant/color
   */
  variant?: BadgeVariant;

  /**
   * Badge size
   */
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-secondary/50 text-white/80',
  primary: 'bg-cyan/20 text-cyan border border-cyan/30',
  success: 'bg-lime/20 text-lime border border-lime/30',
  warning: 'bg-gold/20 text-gold border border-gold/30',
  error: 'bg-red-error/20 text-red-error border border-red-error/30',
  epic: 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold',
  legendary: 'bg-gradient-to-r from-gold/30 to-orange/30 text-gold border border-gold/60 font-bold',
};

const sizeStyles = {
  sm: 'px-2 py-1 text-micro',
  md: 'px-2.5 py-1.5 text-caption',
};

/**
 * Badge Component
 *
 * @example
 * // Simple badge
 * <Badge>New</Badge>
 *
 * @example
 * // Status badges
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Failed</Badge>
 *
 * @example
 * // Rarity badges
 * <Badge variant="epic">Epic</Badge>
 * <Badge variant="legendary">Legendary</Badge>
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors duration-150',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
