import clsx from 'clsx';
import { forwardRef } from 'react';

interface TabPageSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  insetTop?: number;
  insetBottom?: number;
}

/**
 * Общий контейнер вкладок. Внешние safe-area отступы уже учтены оболочкой `App`,
 * поэтому здесь оставляем только регулируемые внутренние паддинги.
 */
export const TabPageSurface = forwardRef<HTMLDivElement, TabPageSurfaceProps>(
  ({ className, insetTop = 0, insetBottom = 16, style, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx('flex w-full flex-1 flex-col gap-md px-md', className)}
      style={{
        paddingTop: `${insetTop}px`,
        paddingBottom: `${insetBottom}px`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
);

TabPageSurface.displayName = 'TabPageSurface';
