import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export type SkeletonVariant = 'text' | 'rect' | 'circle';
export type SkeletonAnimation = 'shimmer' | 'pulse';
export type SkeletonAccessibility = 'decorative' | 'status';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  animation?: SkeletonAnimation;
  accessibility?: SkeletonAccessibility;
  width?: number | string;
  height?: number | string;
  count?: number;
}

const VARIANT_CLASS: Record<SkeletonVariant, string> = {
  text: 'rounded-full',
  rect: 'rounded-2xl',
  circle: 'rounded-full',
};

const ANIMATION_CLASS: Record<SkeletonAnimation, string> = {
  shimmer:
    'animate-shimmer bg-gradient-to-r from-layer-overlay-strong/70 via-surface-glass-strong to-layer-overlay-strong/70 bg-[length:200%_100%]',
  pulse: 'animate-pulse bg-layer-overlay-strong/70',
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant = 'rect',
      animation = 'shimmer',
      accessibility = 'decorative',
      width,
      height,
      count = 1,
      style,
      ...rest
    },
    ref
  ) => {
    const resolvedStyle: React.CSSProperties = { ...style };
    if (width) {
      resolvedStyle.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height) {
      resolvedStyle.height = typeof height === 'number' ? `${height}px` : height;
    } else if (variant === 'text') {
      resolvedStyle.height = '0.75rem';
    }

    const baseClass = clsx(VARIANT_CLASS[variant], ANIMATION_CLASS[animation], className);
    const ariaProps:
      | { 'aria-hidden': true }
      | { role: 'status'; 'aria-live': 'polite'; 'aria-busy': true } =
      accessibility === 'status'
        ? { role: 'status', 'aria-live': 'polite', 'aria-busy': true }
        : { 'aria-hidden': true };

    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key -- skeletons are purely decorative
            key={index}
            ref={index === 0 ? ref : null}
            className={baseClass}
            style={resolvedStyle}
            {...ariaProps}
            {...rest}
          />
        ))}
      </>
    );
  }
);

Skeleton.displayName = 'Skeleton';
