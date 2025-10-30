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

import { useRef, useEffect, useMemo, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { useSafeArea } from '../hooks';

export interface TabBarItem {
  id: string;
  label: string;
  icon: ReactNode;
  title?: string; // Full name for accessibility
  disabled?: boolean;
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

  const enabledTabs = useMemo(() => tabs.filter(tab => !tab.disabled), [tabs]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = enabledTabs.length - 1;
      const focusTab = (nextIndex: number) => {
        const next = enabledTabs[nextIndex];
        if (!next) {
          return;
        }
        onChange(next.id);
        requestAnimationFrame(() => {
          const button = document.getElementById(`tab-${next.id}`) as HTMLButtonElement | null;
          button?.focus();
        });
      };

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          focusTab(nextIndex);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const nextIndex = index === 0 ? lastIndex : index - 1;
          focusTab(nextIndex);
          break;
        }
        case 'Home':
          event.preventDefault();
          focusTab(0);
          break;
        case 'End':
          event.preventDefault();
          focusTab(lastIndex);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onChange(enabledTabs[index]?.id ?? active);
          break;
        default:
          break;
      }
    },
    [enabledTabs, onChange, active]
  );

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
      className="fixed bottom-0 left-0 right-0 surface-translucent border-t border-[var(--color-border-subtle)] z-[100] w-full backdrop-blur"
      style={footerPadding}
      role="tablist"
      aria-label="Основная навигация"
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
        {enabledTabs.map((tab, index) => {
          const isActive = active === tab.id;
          const buttonClasses = `relative flex flex-col gap-1 items-center justify-center flex-shrink-0 px-sm-plus py-sm min-w-[68px] min-h-[48px] cursor-pointer transition-colors border-none bg-none text-xs tracking-wide ${
            isActive
              ? 'text-[var(--color-text-accent)] font-semibold bg-gradient-to-br from-[rgba(0,217,255,0.22)] to-[rgba(0,255,136,0.24)] rounded-xl shadow-glow after:content-[""] after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-2/3 after:-translate-x-1/2 after:rounded-full after:bg-[var(--color-text-accent)] after:opacity-90'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] rounded-xl'
          } focus-ring`;
          const labelClasses = `text-label uppercase ${
            isActive ? 'text-[var(--color-text-accent)]' : 'text-[var(--color-text-secondary)]'
          }`;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              className={buttonClasses}
              type="button"
              onClick={() => onChange(tab.id)}
              title={tab.title || tab.label}
              aria-selected={isActive}
              aria-label={`${tab.label} tab`}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`tab-panel-${tab.id}`}
              onKeyDown={event => handleKeyDown(event, index)}
            >
              <span className="text-title" aria-hidden="true">
                {tab.icon}
              </span>
              <span className={labelClasses}>{tab.label}</span>
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
