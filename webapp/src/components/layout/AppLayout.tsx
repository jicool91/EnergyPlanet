import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import { miniApp } from '@tma.js/sdk';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useTheme } from '@/hooks/useTheme';
import {
  BottomNavigation,
  type BottomNavigationTab,
  type BottomNavigationTabId,
} from './BottomNavigation';

const NAVIGATION_RESERVE_PX = 88;

interface AppLayoutProps {
  children: ReactNode;
  activeTab: BottomNavigationTabId;
  tabs: BottomNavigationTab[];
  onTabSelect: (tab: BottomNavigationTab) => void;
  header?: ReactNode;
}

export function AppLayout({ children, activeTab, tabs, onTabSelect, header }: AppLayoutProps) {
  const { safeArea } = useSafeArea();
  const { theme } = useTheme();
  const safeTop = Math.max(0, safeArea.safe.top ?? 0);
  const safeBottom = Math.max(0, safeArea.safe.bottom ?? 0);
  const safeLeft = Math.max(0, safeArea.safe.left ?? 0);
  const safeRight = Math.max(0, safeArea.safe.right ?? 0);

  useEffect(() => {
    const headerColor =
      theme.header_color ?? theme.secondary_bg_color ?? theme.section_bg_color ?? theme.bg_color;
    const backgroundColor = theme.bg_color ?? headerColor;

    const webApp =
      typeof window !== 'undefined'
        ? ((
            window as typeof window & {
              Telegram?: {
                WebApp?: {
                  setHeaderColor?: (color: string) => void;
                  setBackgroundColor?: (color: string) => void;
                };
              };
            }
          ).Telegram?.WebApp ?? null)
        : null;

    try {
      if (headerColor) {
        miniApp.setHeaderColor(headerColor);
      } else {
        miniApp.setHeaderColor('bg_color');
      }
    } catch {
      if (headerColor) {
        webApp?.setHeaderColor?.(headerColor);
      } else {
        webApp?.setHeaderColor?.('bg_color');
      }
    }

    if (backgroundColor) {
      webApp?.setBackgroundColor?.(backgroundColor);
    }
  }, [theme]);

  const containerClassName =
    'relative flex min-h-screen w-full flex-col max-w-screen-md lg:max-w-screen-lg';

  const sharedHorizontalPadding = useMemo(
    () => ({
      paddingLeft: `${safeLeft + 16}px`,
      paddingRight: `${safeRight + 16}px`,
    }),
    [safeLeft, safeRight]
  );

  const headerStyle = useMemo(
    () => ({
      ...sharedHorizontalPadding,
      paddingTop: `${safeTop + 12}px`,
    }),
    [safeTop, sharedHorizontalPadding]
  );

  const mainPadding = useMemo(() => {
    const bottomPadding = NAVIGATION_RESERVE_PX + safeBottom;
    return {
      ...sharedHorizontalPadding,
      paddingBottom: `${bottomPadding}px`,
      paddingTop: '12px',
    };
  }, [safeBottom, sharedHorizontalPadding]);

  return (
    <div className="flex min-h-screen w-full justify-center bg-surface-primary text-text-primary">
      <div className={containerClassName}>
        {header ? (
          <header className="z-10 flex flex-col gap-1 pb-3" style={headerStyle}>
            {header}
          </header>
        ) : (
          <div style={{ height: `${safeTop}px` }} aria-hidden />
        )}
        <main className="flex-1 overflow-y-auto" style={mainPadding} data-testid="next-ui-main">
          {children}
        </main>
        <BottomNavigation
          tabs={tabs}
          activeTab={activeTab}
          onSelect={onTabSelect}
          insetBottom={safeBottom}
        />
      </div>
    </div>
  );
}
