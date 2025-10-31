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
      'relative overflow-hidden rounded-3xl px-6 py-5 text-[var(--color-text-primary)] shadow-[0_18px_48px_rgba(0,0,0,0.32)] transition-transform duration-200 ease-out backdrop-blur-sm';

    const variantStyles: Record<NonNullable<CardProps['variant']>, string> = {
      default: 'border border-[rgba(255,255,255,0.08)] bg-[rgba(29,32,37,0.92)]',
      elevated:
        'border border-[rgba(255,255,255,0.12)] bg-[rgba(39,42,47,0.95)] shadow-[0_24px_64px_rgba(0,0,0,0.42)]',
      outlined: 'border border-[rgba(243,186,47,0.28)] bg-[rgba(29,32,37,0.65)] backdrop-blur-md',
    };

    const highlightStyles = highlighted
      ? 'ring-2 ring-[var(--color-accent-gold)] shadow-[0_20px_52px_rgba(243,186,47,0.28)]'
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
          isInteractive &&
            'transition-transform hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(243,186,47,0.18)]',
          className
        )}
        {...props}
      >
        {highlighted && (
          <span className="absolute right-4 top-4 rounded-full border border-[rgba(243,186,47,0.45)] bg-[rgba(243,186,47,0.16)] px-3 py-1 text-label font-bold text-[var(--color-accent-gold)] shadow-[0_12px_28px_rgba(243,186,47,0.35)]">
            {highlightBadge}
          </span>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
