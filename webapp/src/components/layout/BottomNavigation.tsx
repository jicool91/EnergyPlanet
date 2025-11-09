import clsx from 'clsx';
import { memo } from 'react';
import { Text } from '@/components/ui/Text';
import { NAVIGATION_BUFFER_PX } from '@/constants/layout';

export type BottomNavigationTabId = 'tap' | 'shop' | 'friends' | 'clan' | 'chat';

export interface BottomNavigationTab {
  id: BottomNavigationTabId;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface BottomNavigationProps {
  tabs: BottomNavigationTab[];
  activeTab: BottomNavigationTabId;
  onSelect: (tab: BottomNavigationTab) => void;
  insetBottom: number;
}

export const BottomNavigation = memo(function BottomNavigation({
  tabs,
  activeTab,
  onSelect,
  insetBottom,
}: BottomNavigationProps) {
  const safePadding = Math.max(0, insetBottom);
  const paddingBottomValue = `calc(${safePadding + NAVIGATION_BUFFER_PX}px + var(--tg-content-safe-area-bottom, 0px))`;

  return (
    <nav
      className="pointer-events-none sticky bottom-0 z-50 mt-auto flex w-full justify-center"
      aria-label="Главная навигация"
    >
      <div
        className="pointer-events-auto w-full max-w-screen-md px-4 lg:max-w-screen-lg"
        style={{ paddingBottom: paddingBottomValue }}
      >
        <div className="flex items-center justify-between rounded-[28px] border border-border-layer bg-layer-overlay-strong px-2 py-2 shadow-elevation-3 backdrop-blur-md">
          {tabs.map(tab => {
            const isActive = tab.id === activeTab;
            const badgeContent = tab.badge && tab.badge > 0 ? tab.badge : null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab)}
                className={clsx(
                  'flex h-14 w-14 flex-col items-center justify-center rounded-2xl text-label font-medium transition-all duration-150 will-change-transform focus-outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
                  isActive
                    ? 'bg-state-accent-pill text-accent-gold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-layer-overlay-ghost-soft'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
                data-active={isActive}
              >
                <span className="relative text-title">
                  {tab.icon}
                  {badgeContent ? (
                    <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-accent-gold px-1 text-[10px] font-semibold leading-[14px] text-text-inverse shadow-glow-gold">
                      {badgeContent > 99 ? '99+' : badgeContent}
                    </span>
                  ) : null}
                </span>
                <Text
                  as="span"
                  variant="label"
                  tone={isActive ? 'accent' : 'secondary'}
                  className="mt-1"
                >
                  {tab.label}
                </Text>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
