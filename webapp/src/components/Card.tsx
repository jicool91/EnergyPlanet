import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

/**
 * Card Component
 * Standardized container for content
 * Uses design system: border, shadow, padding, border-radius
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
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
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      highlighted = false,
      highlightBadge = 'Featured',
      variant = 'default',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'relative overflow-hidden rounded-3xl px-6 py-5 text-text-primary shadow-elevation-3 transition-transform duration-200 ease-out backdrop-blur-sm';

    const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
      default: 'border border-border-layer bg-layer-strong',
      elevated: 'border border-border-layer-strong bg-layer-elevated shadow-elevation-4',
      outlined: 'border border-border-featured bg-layer-soft backdrop-blur-md',
    };

    const highlightStyles = highlighted ? 'ring-2 ring-accent-gold shadow-glow-gold' : '';
    const isInteractive =
      typeof props.onClick === 'function' ||
      props.role === 'button' ||
      props.tabIndex !== undefined;

    return (
      <div
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          highlightStyles,
          isInteractive && 'transition-transform hover:-translate-y-0.5 hover:shadow-glow',
          className
        )}
        {...props}
      >
        {highlighted && (
          <span className="absolute right-4 top-4 rounded-full border border-border-featured bg-gradient-soft px-3 py-1 text-label font-bold text-accent-gold shadow-glow-gold">
            {highlightBadge}
          </span>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
