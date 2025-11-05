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

type PanelSpacing = 'none' | 'sm' | 'md' | 'lg';

export interface PanelProps extends Omit<SurfaceProps, 'children'> {
  /** Wrapper spacing between children */
  spacing?: PanelSpacing;
  /** Panel preset */
  variant?: 'default' | 'muted' | 'accent';
  children?: SurfaceProps['children'];
}

const spacingClass: Record<PanelSpacing, string> = {
  none: 'gap-0',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
};

const panelVariants: Record<
  NonNullable<PanelProps['variant']>,
  {
    tone: SurfaceTone;
    border: SurfaceBorder;
    elevation: SurfaceElevation;
  }
> = {
  default: { tone: 'overlay', border: 'subtle', elevation: 'soft' },
  muted: { tone: 'secondary', border: 'none', elevation: 'none' },
  accent: { tone: 'accent', border: 'accent', elevation: 'medium' },
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      className,
      spacing = 'md',
      variant = 'default',
      tone,
      border,
      elevation,
      padding = 'lg',
      rounded = '3xl',
      children,
      ...props
    },
    ref
  ) => {
    const preset = panelVariants[variant];

    return (
      <Surface
        ref={ref}
        tone={tone ?? preset.tone}
        border={border ?? preset.border}
        elevation={elevation ?? preset.elevation}
        padding={padding as SurfacePadding}
        rounded={rounded}
        className={clsx('flex flex-col', spacingClass[spacing], className)}
        {...props}
      >
        {children}
      </Surface>
    );
  }
);

Panel.displayName = 'Panel';
