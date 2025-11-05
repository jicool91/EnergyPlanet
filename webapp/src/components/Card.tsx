import { forwardRef } from 'react';
import clsx from 'clsx';
import {
  Surface,
  type SurfaceProps,
  type SurfaceTone,
  type SurfaceBorder,
  type SurfaceElevation,
  type SurfacePadding,
} from './ui/Surface';

export interface CardProps extends Omit<SurfaceProps, 'children'> {
  /** Highlight the card with accent ring */
  highlighted?: boolean;
  /** Custom badge label for highlighted cards */
  highlightBadge?: string;
  /** Legacy presets kept for backwards compatibility */
  variant?: 'default' | 'elevated' | 'outlined';
  children?: SurfaceProps['children'];
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      highlighted = false,
      highlightBadge = 'Featured',
      variant = 'default',
      tone,
      border,
      elevation,
      padding,
      rounded,
      interactive,
      children,
      ...props
    },
    ref
  ) => {
    const variantDefaults: Record<
      NonNullable<CardProps['variant']>,
      {
        tone: SurfaceTone;
        border: SurfaceBorder;
        elevation: SurfaceElevation;
      }
    > = {
      default: { tone: 'overlay', border: 'subtle', elevation: 'medium' },
      elevated: { tone: 'overlay', border: 'strong', elevation: 'strong' },
      outlined: { tone: 'overlay', border: 'accent', elevation: 'soft' },
    };

    const preset = variantDefaults[variant];

    const resolvedTone = tone ?? preset.tone;
    const resolvedBorder = border ?? preset.border;
    const resolvedElevation = elevation ?? preset.elevation;
    const resolvedPadding: SurfacePadding = padding ?? 'lg';
    const resolvedRadius = rounded ?? '3xl';

    const isInteractive =
      typeof props.onClick === 'function' ||
      props.role === 'button' ||
      props.tabIndex !== undefined;

    const highlightStyles = highlighted ? 'ring-2 ring-accent-gold shadow-glow-gold' : '';

    return (
      <Surface
        ref={ref}
        tone={resolvedTone}
        border={resolvedBorder}
        elevation={resolvedElevation}
        padding={resolvedPadding}
        rounded={resolvedRadius}
        interactive={interactive ?? isInteractive}
        className={clsx(
          'relative overflow-hidden text-text-primary backdrop-blur-sm',
          highlightStyles,
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
      </Surface>
    );
  }
);

Card.displayName = 'Card';
