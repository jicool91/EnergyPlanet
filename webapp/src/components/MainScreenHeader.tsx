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
 *   onSettingsClick={() => setActiveTab('settings')}
 * />
 * ```
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '../utils/number';
import { LevelBar } from './LevelBar';
import { useSafeArea } from '../hooks';

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
  const contentTop = Math.max(0, safeArea.content.top ?? 0);
  const fallbackTop = Math.max(0, safeArea.safe.top ?? 0);
  const { left: safeLeft, right: safeRight } = safeArea.safe;
  const headerPadding = useMemo(() => {
    return {
      paddingTop: '8px',
      paddingLeft: `${Math.max(0, safeLeft) + 8}px`,
      paddingRight: `${Math.max(0, safeRight) + 8}px`,
    };
  }, [safeLeft, safeRight]);

  return (
    <header
      className="fixed left-0 right-0 z-50 border-b backdrop-blur-sm transition-colors duration-200"
      style={{
        ...headerPadding,
        top: `${Math.max(contentTop, fallbackTop)}px`,
        background: 'linear-gradient(180deg, var(--app-header-bg) 0%, var(--app-bg) 85%)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex h-14 items-center justify-between gap-md px-md py-md">
        {/* Left: Level & Energy */}
        <div className="flex items-center gap-md min-w-0">
          {/* Level Badge */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <span className="text-caption text-[var(--color-text-secondary)]">LV</span>
            <span className="text-subheading font-bold text-[var(--color-text-accent)]">
              {level}
            </span>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-sm min-w-0">
            <span className="text-subheading flex-shrink-0" role="img" aria-label="Energy">
              ⚡
            </span>
            <div className="min-w-0">
              <p className="m-0 text-caption text-[var(--color-text-secondary)] truncate">Energy</p>
              <p className="m-0 text-body font-semibold text-[var(--color-text-primary)] truncate">
                {energyCompact}
              </p>
            </div>
          </div>

          {/* Stars + Quick Top-Up */}
          <div className="flex items-center gap-xs-plus min-w-0">
            <span className="text-subheading flex-shrink-0" role="img" aria-label="Stars">
              ⭐
            </span>
            <div className="min-w-0">
              <p className="m-0 text-caption text-[var(--color-text-secondary)] truncate">Stars</p>
              <p className="m-0 text-body font-semibold text-[var(--color-text-accent)] truncate">
                {starsCompact}
              </p>
            </div>
            {/* Quick Top-Up Button */}
            {onShopClick && (
              <motion.button
                onClick={onShopClick}
                className="flex-shrink-0 ml-1 w-6 h-6 rounded-full flex items-center justify-center border border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] text-[var(--color-text-accent)] hover:shadow-glow-card transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
                title="Quick Top-Up Stars"
                type="button"
                aria-label="Quick Top-Up Stars"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <span className="text-caption font-bold" aria-hidden="true">
                  +
                </span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Shop/Top-up Button */}
          {onShopClick && (
            <button
              onClick={onShopClick}
              className="flex-shrink-0 px-3 py-2 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-secondary)] text-body font-medium text-[var(--color-text-accent)] hover:shadow-glow-card transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
              title="Top-up Stars"
              type="button"
              aria-label="Top-up Stars"
            >
              <span className="text-subheading" aria-hidden="true">
                🛍️
              </span>
            </button>
          )}

          {/* Settings Button */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 p-2 rounded-md transition-colors duration-150 text-[var(--color-text-secondary)] hover:text-[var(--color-text-accent)] hover:bg-[var(--color-surface-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-header-bg)]"
              title="Settings"
              aria-label="Settings"
              type="button"
            >
              <span className="text-subheading" aria-hidden="true">
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
