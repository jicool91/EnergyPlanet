import { createElement } from 'react';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import clsx from 'clsx';

type TextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

const VARIANT_CLASS: Record<TextVariant, string> = {
  display: 'text-display',
  heading: 'text-heading',
  title: 'text-title',
  body: 'text-body',
  caption: 'text-caption',
};

const WEIGHT_CLASS: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export interface BaseTextProps<T extends ElementType> {
  as?: T;
  variant?: TextVariant;
  weight?: TextWeight;
  className?: string;
  children: ReactNode;
}

type PolymorphicProps<T extends ElementType> = BaseTextProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof BaseTextProps<T>>;

export function Text<T extends ElementType = 'p'>({
  as,
  variant = 'body',
  weight = 'regular',
  className,
  children,
  ...rest
}: PolymorphicProps<T>) {
  const Component = (as ?? 'p') as ElementType;
  return createElement(
    Component,
    {
      className: clsx(VARIANT_CLASS[variant], WEIGHT_CLASS[weight], className),
      ...rest,
    },
    children
  );
}
