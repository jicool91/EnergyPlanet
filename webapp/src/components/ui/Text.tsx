import { createElement } from 'react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import clsx from 'clsx';

export type TextVariant =
  | 'display'
  | 'hero'
  | 'heading'
  | 'title'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'micro'
  | 'label';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'inverse'
  | 'success'
  | 'warning'
  | 'danger';

type TextAlign = 'start' | 'center' | 'end' | 'justify';
type TextTransform = 'none' | 'uppercase' | 'capitalize';

const VARIANT_CLASS: Record<TextVariant, string> = {
  display: 'text-display',
  hero: 'text-hero',
  heading: 'text-heading',
  title: 'text-title',
  body: 'text-body',
  bodySm: 'text-body-sm',
  caption: 'text-caption',
  micro: 'text-micro',
  label: 'text-label',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const TONE_CLASS: Record<TextTone, string> = {
  primary: 'text-text-primary',
  secondary: 'text-text-secondary',
  tertiary: 'text-text-tertiary',
  accent: 'text-text-accent',
  inverse: 'text-text-inverse',
  success: 'text-feedback-success',
  warning: 'text-feedback-warning',
  danger: 'text-feedback-error',
};

const ALIGN_CLASS: Record<TextAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
  justify: 'text-justify',
};

const TRANSFORM_CLASS: Record<TextTransform, string> = {
  none: '',
  uppercase: 'uppercase tracking-[0.12em]',
  capitalize: 'capitalize',
};

export interface BaseTextProps<T extends ElementType> {
  as?: T;
  variant?: TextVariant;
  weight?: TextWeight;
  tone?: TextTone;
  align?: TextAlign;
  transform?: TextTransform;
  className?: string;
  children: ReactNode;
}

type PolymorphicProps<T extends ElementType> = BaseTextProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BaseTextProps<T>>;

export function Text<T extends ElementType = 'p'>({
  as,
  variant = 'body',
  weight = 'regular',
  tone = 'primary',
  align,
  transform = 'none',
  className,
  children,
  ...rest
}: PolymorphicProps<T>) {
  const Component = (as ?? 'p') as ElementType;
  return createElement(
    Component,
    {
      className: clsx(
        VARIANT_CLASS[variant],
        WEIGHT_CLASS[weight],
        TONE_CLASS[tone],
        align ? ALIGN_CLASS[align] : null,
        transform ? TRANSFORM_CLASS[transform] : null,
        className
      ),
      ...rest,
    },
    children
  );
}
