/**
 * Compact Tab Bar Component for Bottom Navigation
 *
 * Features:
 * - Scrollable navigation for many tabs
 * - Active tab highlighting
 * - Responsive design
 * - Safe area padding support
 *
 * Usage:
 * ```tsx
 * <TabBar
 *   tabs={[
 *     { id: 'home', label: 'Главная', icon: '🏠' },
 *     { id: 'shop', label: 'Магазин', icon: '🛍️' },
 *   ]}
 *   active="home"
 *   onChange={(tabId) => setActiveTab(tabId)}
 * />
 * ```
 */

import { useRef, useEffect, useMemo } from 'react';
import { useSafeArea } from '../hooks';

export interface TabBarItem {
  id: string;
  label: string;
  icon: string;
  title?: string; // Full name for accessibility
}

interface TabBarProps {
  tabs: TabBarItem[];
  active: string;
  onChange: (tabId: string) => void;
}

export function TabBar({ tabs, active, onChange }: TabBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const { safeArea } = useSafeArea();
  const { right: safeRight, bottom: safeBottom, left: safeLeft } = safeArea.safe;

  const footerPadding = useMemo(() => {
    return {
      paddingBottom: `${Math.max(0, safeBottom) + 8}px`,
      paddingLeft: `${Math.max(0, safeLeft) + 12}px`,
      paddingRight: `${Math.max(0, safeRight) + 12}px`,
    };
  }, [safeBottom, safeLeft, safeRight]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeBtn = activeTabRef.current;
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();

      // Check if button is visible in viewport
      if (btnRect.left < containerRect.left || btnRect.right > containerRect.right) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [active]);

  return (
    <footer
      className="fixed bottom-0 left-0 right-0 bg-black/85 border-t border-white/10 z-[100] w-full backdrop-blur"
      style={footerPadding}
    >
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
          // Hide scrollbar for better UI
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map(tab => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              className={`flex flex-col gap-1 items-center justify-center flex-shrink-0 px-3 py-2 min-w-[60px] cursor-pointer transition-colors border-none bg-none text-sm ${
                isActive
                  ? 'text-cyan font-semibold'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              } focus-ring`}
              type="button"
              onClick={() => onChange(tab.id)}
              title={tab.title || tab.label}
              aria-selected={isActive}
              aria-label={`${tab.label} tab`}
            >
              <span className="text-lg" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="text-xs whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </footer>
  );
}
