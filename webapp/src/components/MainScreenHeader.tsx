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
import { motion } from 'framer-motion';
import { formatCompactNumber } from '../utils/number';
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
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
  const starsCompact = useMemo(() => formatCompactNumber(Math.floor(stars)), [stars]);
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
      <div className="flex h-14 items-center justify-between gap-md px-md py-md">
        {/* Left: Level & Resources */}
        <div className="flex items-stretch gap-sm-plus min-w-0 divide-x divide-[rgba(255,255,255,0.08)]">
          {/* Level Badge */}
          <div className="flex flex-col items-center justify-center px-sm-plus">
            <span className="text-caption text-[var(--color-text-secondary)] uppercase tracking-[0.18em]">
              Lv
            </span>
            <span className="text-subheading font-bold text-[var(--color-text-accent)]">
              {level}
            </span>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-sm min-w-0 px-sm-plus">
            <span className="text-title flex-shrink-0" role="img" aria-label="Energy">
              ⚡
            </span>
            <div className="min-w-0">
              <p className="m-0 text-caption text-[var(--color-text-secondary)] uppercase tracking-[0.16em]">
                Energy
              </p>
              <p className="m-0 text-body font-semibold text-[var(--color-text-primary)] truncate">
                {energyCompact}
              </p>
            </div>
          </div>

          {/* Stars + Quick Top-Up */}
          <div className="flex items-center gap-sm min-w-0 px-sm-plus">
            <span className="text-title flex-shrink-0" role="img" aria-label="Stars">
              ⭐
            </span>
            <div className="min-w-0">
              <p className="m-0 text-caption text-[var(--color-text-secondary)] uppercase tracking-[0.16em]">
                Stars
              </p>
              <p className="m-0 text-body font-semibold text-[var(--color-text-accent)] truncate">
                {starsCompact}
              </p>
            </div>
            {onShopClick && (
              <motion.button
                onClick={onShopClick}
                className="flex items-center gap-xs rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-success)] px-sm-plus py-xs-plus text-caption font-semibold uppercase tracking-[0.12em] text-[var(--color-surface-primary)] shadow-glow transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
                title="Пополнить Stars"
                type="button"
                aria-label="Пополнить Stars"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                animate={{
                  opacity: [0.85, 1, 0.85],
                  boxShadow: [
                    '0 0 20px rgba(0, 217, 255, 0.45)',
                    '0 0 24px rgba(0, 255, 136, 0.55)',
                    '0 0 20px rgba(0, 217, 255, 0.45)',
                  ],
                }}
                transition={{
                  opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                  boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <span aria-hidden="true" className="text-title leading-none">
                  +
                </span>
                <span className="leading-none">Пополнить</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-sm flex-shrink-0">
          {/* Shop/Top-up Button */}
          {onShopClick && (
            <button
              onClick={onShopClick}
              className="flex-shrink-0 h-11 px-md rounded-xl border border-[var(--color-border-subtle)] bg-[rgba(0,217,255,0.12)] text-caption font-semibold uppercase tracking-[0.14em] text-[var(--color-text-accent)] hover:shadow-glow transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
              title="Открыть магазин Stars"
              type="button"
              aria-label="Открыть магазин Stars"
            >
              <span className="text-title" aria-hidden="true">
                🛍️
              </span>
              <span className="ml-xs hidden sm:inline">Магазин</span>
            </button>
          )}

          {/* Settings Button */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 h-11 w-11 rounded-xl transition-colors duration-150 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)] flex items-center justify-center shadow-elevation-1 hover:shadow-glow"
              title="Settings"
              aria-label="Settings"
              type="button"
            >
              <span className="text-title" aria-hidden="true">
                ⚙️
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Level progress bar at bottom */}
      {xpProgress !== undefined && (
        <LevelBar progress={xpProgress} xpCurrent={undefined} xpTotal={undefined} />
      )}
    </header>
  );
}

export const MainScreenHeader = memo(MainScreenHeaderComponent);

MainScreenHeader.displayName = 'MainScreenHeader';
