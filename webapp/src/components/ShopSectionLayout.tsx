import type { ElementType, HTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

type ShopSectionLayoutVariant = 'stack' | 'grid';

interface ShopSectionLayoutProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children'>,
    PropsWithChildren {
  as?: ElementType;
  spacing?: 'sm' | 'md' | 'lg';
  variant?: ShopSectionLayoutVariant;
}

const spacingClassName: Record<NonNullable<ShopSectionLayoutProps['spacing']>, string> = {
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
};

export function ShopSectionLayout({
  as: Tag = 'section',
  spacing = 'md',
  variant = 'stack',
  className,
  children,
  ...rest
}: ShopSectionLayoutProps) {
  const layoutClass = variant === 'grid' ? 'grid' : 'flex flex-col';
  const Component = Tag as ElementType;

  return (
    <Component className={clsx(layoutClass, spacingClassName[spacing], className)} {...rest}>
      {children}
    </Component>
  );
}
