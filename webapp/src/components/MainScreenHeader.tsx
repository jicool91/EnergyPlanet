/**
 * Main Screen Header Component
 * Compact header for all screens with essential info
 *
 * Features:
 * - Level display with badge
 * - Energy counter (compact format)
 * - XP progress indicator with hover tooltip (optional)
 * - Quick Actions: Shop (Top-up Stars) and Settings buttons
 * - Fixed position, compact height (max 60px)
 * - Gradient level bar at bottom showing XP progress
 *
 * Usage:
 * ```tsx
 * <MainScreenHeader
 *   level={15}
 *   energy={50000}
 *   xpProgress={0.65}
 *   onShopClick={() => setActiveTab('shop')}
 *   onSettingsClick={() => setActiveTab('account')}
 * />
 * ```
 */

import { memo, useMemo } from 'react';
import { LevelBar } from './LevelBar';
import { useSafeArea } from '../hooks';
import { HEADER_BUFFER_PX } from '../constants/layout';

interface MainScreenHeaderProps {
  level: number;
  energy: number;
  stars?: number;
  xpProgress?: number; // 0-1
  onSettingsClick?: () => void;
  onShopClick?: () => void;
}

function MainScreenHeaderComponent({
  level,
  energy,
  stars = 0,
  xpProgress,
  onSettingsClick,
  onShopClick,
}: MainScreenHeaderProps) {
  const energyDisplay = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        notation: 'compact',
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      }).format(energy),
    [energy]
  );
  const starsDisplay = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(stars),
    [stars]
  );
  const { safeArea } = useSafeArea();
  const safeTop = Math.max(0, safeArea.safe.top ?? 0);
  const contentTop = Math.max(0, safeArea.content.top ?? 0);
  const headerBaseInset = safeTop + contentTop;
  const safeLeft = Math.max(0, safeArea.safe.left ?? 0);
  const safeRight = Math.max(0, safeArea.safe.right ?? 0);
  const headerOffsetTop = headerBaseInset + HEADER_BUFFER_PX;
  const headerPadding = useMemo(() => {
    return {
      paddingLeft: `${safeLeft + 8}px`,
      paddingRight: `${safeRight + 8}px`,
    };
  }, [safeLeft, safeRight]);

  return (
    <header
      className="fixed left-0 right-0 z-50 border-b backdrop-blur-sm transition-colors duration-200"
      style={{
        ...headerPadding,
        top: `var(--app-header-offset-top, ${headerOffsetTop}px)`,
        background: 'linear-gradient(180deg, var(--app-header-bg) 0%, var(--app-bg) 85%)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex h-14 items-center justify-between gap-md px-md">
        <div className="flex min-w-0 flex-1 items-center gap-sm-plus">
          <span className="inline-flex items-center gap-xs rounded-full bg-[rgba(0,217,255,0.12)] px-sm-plus py-xs-plus text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-accent)] shadow-[0_8px_18px_rgba(0,217,255,0.22)]">
            <span aria-hidden="true">🚀</span>
            Lv {level}
          </span>
          <div className="flex items-center gap-xs min-w-0">
            <span className="text-lg" aria-hidden="true">
              ⚡
            </span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              {energyDisplay}
            </span>
          </div>
          <div className="flex items-center gap-xs min-w-0">
            <span className="text-sm font-semibold text-[var(--color-text-accent)]">
              {starsDisplay}
            </span>
            {onShopClick && (
              <button
                onClick={onShopClick}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,215,0,0.32)] bg-[rgba(255,215,0,0.15)] text-lg text-[var(--color-text-primary)] shadow-[0_12px_24px_rgba(255,215,0,0.2)] transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)] hover:scale-105"
                type="button"
                aria-label="Открыть пакеты Stars"
              >
                <span aria-hidden="true">⭐</span>
              </button>
            )}
          </div>
          <span className="hidden min-w-[160px] truncate text-xs text-[var(--color-text-secondary)] lg:inline">
            Сохраняйте ритм — акции и бусты обновляются каждые несколько часов.
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-xs">
          {onShopClick && (
            <button
              onClick={onShopClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(0,217,255,0.26)] bg-[rgba(0,217,255,0.18)] text-[var(--color-text-primary)] transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
              title="Магазин"
              aria-label="Открыть магазин"
              type="button"
            >
              <span className="text-lg" aria-hidden="true">
                🛍️
              </span>
            </button>
          )}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(0,0,0,0.25)] text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
              title="Настройки"
              aria-label="Настройки"
              type="button"
            >
              <span className="text-lg" aria-hidden="true">
                ⚙️
              </span>
            </button>
          )}
        </div>
      </div>
      {xpProgress !== undefined && (
        <LevelBar progress={xpProgress} xpCurrent={undefined} xpTotal={undefined} />
      )}
    </header>
  );
}

export const MainScreenHeader = memo(MainScreenHeaderComponent);

MainScreenHeader.displayName = 'MainScreenHeader';
