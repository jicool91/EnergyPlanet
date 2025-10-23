import React from 'react';
import clsx from 'clsx';

/**
 * Card Component
 * Standardized container for content
 * Uses design system: border, shadow, padding, border-radius
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Highlight the card (featured/recommended items)
   * Adds glow effect and lime border
   */
  highlighted?: boolean;

  /**
   * Badge text for highlighted cards (default: "Featured")
   */
  highlightBadge?: string;

  /**
   * Card variant/style
   */
  variant?: 'default' | 'elevated' | 'outlined';
}

/**
 * Card Component
 *
 * @example
 * // Default card
 * <Card>Content here</Card>
 *
 * @example
 * // Highlighted card (featured item)
 * <Card highlighted>
 *   <h3>Featured Building</h3>
 *   <p>This is the best choice!</p>
 * </Card>
 *
 * @example
 * // Elevated card (more shadow)
 * <Card variant="elevated">
 *   Important info
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, highlighted = false, highlightBadge = 'Featured', variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-dark-secondary/60 border-cyan/[0.14] shadow-card',
      elevated: 'bg-dark-secondary/70 border-cyan/[0.14] shadow-lg',
      outlined: 'bg-transparent border-cyan/[0.22] shadow-none',
    };

    const baseStyles = 'rounded-lg border p-4 transition-all duration-150 ease-out';

    const highlightStyles = highlighted
      ? `border-lime/60 shadow-lg relative bg-dark-secondary/80 before:content-["${highlightBadge}"] before:absolute before:-top-2 before:right-4 before:bg-gradient-to-br before:from-gold/100 before:to-orange/100 before:text-dark-bg before:text-micro before:font-bold before:px-3 before:py-1.5 before:rounded-full before:shadow-md`
      : '';

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variantStyles[variant], highlightStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
