import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

export type SurfaceTone =
  | 'primary'
  | 'secondary'
  | 'overlay'
  | 'overlayMedium'
  | 'overlayStrong'
  | 'glass'
  | 'accent'
  | 'dual';

export type SurfaceBorder = 'none' | 'subtle' | 'strong' | 'accent';
export type SurfaceShadow = 'none' | 'soft' | 'medium' | 'strong';
export type SurfacePadding = 'none' | 'sm' | 'md' | 'lg';

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  tone?: SurfaceTone;
  border?: SurfaceBorder;
  shadow?: SurfaceShadow;
  padding?: SurfacePadding;
  rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const TONE_CLASS: Record<SurfaceTone, string> = {
  primary: 'bg-surface-primary',
  secondary: 'bg-surface-secondary',
  overlay: 'bg-layer-overlay-soft',
  overlayMedium: 'bg-layer-overlay-medium',
  overlayStrong: 'bg-layer-overlay-strong',
  glass: 'bg-surface-glass backdrop-blur-md',
  accent: 'bg-surface-accent text-text-inverse',
  dual: 'bg-surface-dual-soft',
};

const BORDER_CLASS: Record<SurfaceBorder, string> = {
  none: 'border-0',
  subtle: 'border border-border-layer',
  strong: 'border border-border-layer-strong',
  accent: 'border border-featured',
};

const SHADOW_CLASS: Record<SurfaceShadow, string> = {
  none: '',
  soft: 'shadow-elevation-1',
  medium: 'shadow-elevation-2',
  strong: 'shadow-[0_16px_40px_rgba(0,0,0,0.38)]',
};

const PADDING_CLASS: Record<SurfacePadding, string> = {
  none: 'p-0',
  sm: 'px-3 py-2',
  md: 'px-4 py-3',
  lg: 'px-6 py-4',
};

const ROUNDED_CLASS: Record<NonNullable<SurfaceProps['rounded']>, string> = {
  none: 'rounded-none',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[28px]',
  '3xl': 'rounded-[32px]',
};

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      tone = 'overlay',
      border = 'subtle',
      shadow = 'medium',
      padding = 'md',
      rounded = 'xl',
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const toneClass = TONE_CLASS[tone];
    const borderClass = BORDER_CLASS[border];
    const shadowClass = SHADOW_CLASS[shadow];
    const paddingClass = PADDING_CLASS[padding];
    const roundedClass = ROUNDED_CLASS[rounded];

    return (
      <div
        ref={ref}
        className={clsx(toneClass, borderClass, shadowClass, paddingClass, roundedClass, className)}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

Surface.displayName = 'Surface';
