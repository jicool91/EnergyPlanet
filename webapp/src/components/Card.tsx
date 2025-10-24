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
      'relative rounded-lg p-4 transition-all duration-150 ease-out text-[var(--color-text-primary)]';

    const variantStyles = {
      default:
        'bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] shadow-card',
      elevated:
        'bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] shadow-lg',
      outlined: 'bg-transparent border border-[var(--color-border-strong)] shadow-none',
    };

    const highlightStyles = highlighted ? 'ring-2 ring-[var(--color-success)] shadow-lg' : '';
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
          isInteractive && 'card-interactive',
          className
        )}
        {...props}
      >
        {highlighted && (
          <span className="absolute -top-2 right-4 rounded-full bg-[var(--color-success)] px-3 py-1.5 text-[var(--color-surface-primary)] text-micro font-bold shadow-md">
            {highlightBadge}
          </span>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
