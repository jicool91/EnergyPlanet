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
  ({ className, highlighted = false, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default: 'bg-dark-secondary/60 border-cyan/[0.14] shadow-card',
      elevated: 'bg-dark-secondary/70 border-cyan/[0.14] shadow-lg',
      outlined: 'bg-transparent border-cyan/[0.22] shadow-none',
    };

    const baseStyles = 'rounded-lg border p-4 transition-all duration-150 ease-out';

    const highlightStyles = highlighted
      ? 'border-lime/60 shadow-lg relative bg-dark-secondary/80 after:content-["Featured"] after:absolute after:-top-2 after:right-4 after:bg-gradient-to-br after:from-lime/90 after:to-cyan/90 after:text-dark-bg after:text-micro after:font-bold after:px-2.5 after:py-1 after:rounded-full'
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
