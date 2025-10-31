import clsx from 'clsx';
import { memo } from 'react';

export type BottomNavigationTabId = 'tap' | 'exchange' | 'friends' | 'earn' | 'airdrop';

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
  const paddingBottom = safePadding + 12;

  return (
    <nav
      className="pointer-events-none sticky bottom-0 z-50 mt-auto flex w-full justify-center"
      aria-label="Главная навигация"
    >
      <div
        className="pointer-events-auto w-full max-w-xl px-4"
        style={{ paddingBottom: `${paddingBottom}px` }}
      >
        <div className="flex items-center justify-between rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[rgba(20,22,28,0.85)] px-2 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
          {tabs.map(tab => {
            const isActive = tab.id === activeTab;
            const badgeContent = tab.badge && tab.badge > 0 ? tab.badge : null;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelect(tab)}
                className={clsx(
                  'flex h-14 w-14 flex-col items-center justify-center rounded-2xl text-xs font-medium transition-all duration-150 will-change-transform focus-outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]',
                  isActive
                    ? 'bg-[rgba(243,186,47,0.14)] text-[var(--color-accent-gold)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={tab.label}
                data-active={isActive}
              >
                <span className="relative text-lg">
                  {tab.icon}
                  {badgeContent ? (
                    <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-[var(--color-accent-gold)] px-1 text-[10px] font-semibold leading-[14px] text-[var(--color-bg-primary)] shadow-[0_2px_8px_rgba(243,186,47,0.45)]">
                      {badgeContent > 99 ? '99+' : badgeContent}
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
