import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useSafeArea } from '@/hooks/useSafeArea';
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
  const safeTop = Math.max(0, safeArea.safe.top ?? 0);
  const safeBottom = Math.max(0, safeArea.safe.bottom ?? 0);
  const safeLeft = Math.max(0, safeArea.safe.left ?? 0);
  const safeRight = Math.max(0, safeArea.safe.right ?? 0);

  const mainPadding = useMemo(() => {
    const bottomPadding = NAVIGATION_RESERVE_PX + safeBottom;
    return {
      paddingBottom: `${bottomPadding}px`,
      paddingLeft: `${safeLeft + 16}px`,
      paddingRight: `${safeRight + 16}px`,
    };
  }, [safeBottom, safeLeft, safeRight]);

  return (
    <div className="flex min-h-screen w-full justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="relative flex min-h-screen w-full max-w-xl flex-col">
        {header ? (
          <header
            className="z-10 flex flex-col gap-1 px-4 pb-3 pt-6"
            style={{ paddingTop: `${safeTop + 12}px` }}
          >
            {header}
          </header>
        ) : (
          <div style={{ height: `${safeTop}px` }} aria-hidden />
        )}
        <main
          className="flex-1 overflow-y-auto pb-8 pt-2"
          style={mainPadding}
          data-testid="next-ui-main"
        >
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
