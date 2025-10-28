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
      'relative overflow-hidden rounded-2xl p-md transition-all duration-200 ease-out text-[var(--color-text-primary)] backdrop-blur-sm';

    const variantStyles = {
      default:
        'bg-[rgba(10,16,38,0.88)] border border-[var(--color-border-subtle)] shadow-elevation-2',
      elevated:
        'bg-[rgba(12,20,48,0.92)] border border-[color-mix(in srgb,_var(--color-border-subtle)_70%,_transparent)] shadow-elevation-3',
      outlined:
        'bg-[rgba(8,12,26,0.65)] border border-[color-mix(in srgb,_var(--color-border-subtle)_55%,_transparent)] shadow-none',
    };

    const highlightStyles = highlighted
      ? 'ring-[3px] ring-[rgba(0,255,136,0.45)] shadow-glow-lime'
      : '';
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
          isInteractive && 'card-interactive hover:-translate-y-0.5',
          className
        )}
        {...props}
      >
        {highlighted && (
          <span className="absolute top-3 right-3 rounded-full bg-[rgba(0,255,136,0.18)] px-sm-plus py-xs text-label font-bold text-[var(--color-success)] border border-[rgba(0,255,136,0.45)] shadow-glow-lime">
            {highlightBadge}
          </span>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
