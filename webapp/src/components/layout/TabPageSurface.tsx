import clsx from 'clsx';
import { forwardRef } from 'react';
import { useSafeArea } from '@/hooks';

interface TabPageSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  insetTop?: number;
  insetBottom?: number;
}

/**
 * Shared wrapper for вкладки (кроме Home).
 * Приводит паддинги к safe-area из Telegram и к дизайновым токенам.
 */
export const TabPageSurface = forwardRef<HTMLDivElement, TabPageSurfaceProps>(
  ({ className, insetTop = 56, insetBottom = 16, style, children, ...rest }, ref) => {
    const { safeArea } = useSafeArea();
    const topPadding = Math.max(0, safeArea.content.top) + insetTop;
    const bottomPadding = Math.max(0, safeArea.content.bottom) + insetBottom;

    return (
      <div
        ref={ref}
        className={clsx('flex w-full flex-1 flex-col gap-lg px-lg', className)}
        style={{
          paddingTop: `${topPadding}px`,
          paddingBottom: `${bottomPadding}px`,
          ...style,
        }}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

TabPageSurface.displayName = 'TabPageSurface';
