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

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatCompactNumber } from '../utils/number';
import { LevelBar } from './LevelBar';

interface MainScreenHeaderProps {
  level: number;
  energy: number;
  stars?: number;
  xpProgress?: number; // 0-1
  onSettingsClick?: () => void;
  onShopClick?: () => void;
}

export function MainScreenHeader({
  level,
  energy,
  stars = 0,
  xpProgress,
  onSettingsClick,
  onShopClick,
}: MainScreenHeaderProps) {
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);
  const starsCompact = useMemo(() => formatCompactNumber(Math.floor(stars)), [stars]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-black/70 border-b border-white/10 backdrop-blur-sm"
      style={{
        paddingTop: 'var(--safe-area-top)',
        paddingLeft: 'var(--safe-area-left)',
        paddingRight: 'var(--safe-area-right)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 gap-3 h-14">
        {/* Left: Level & Energy */}
        <div className="flex items-center gap-4 min-w-0">
          {/* Level Badge */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <span className="text-xs text-white/60">LV</span>
            <span className="text-sm font-bold text-cyan">{level}</span>
          </div>

          {/* Energy */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">⚡</span>
            <div className="min-w-0">
              <p className="m-0 text-xs text-white/60 truncate">Energy</p>
              <p className="m-0 text-sm font-semibold text-white truncate">{energyCompact}</p>
            </div>
          </div>

          {/* Stars + Quick Top-Up */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-lg flex-shrink-0">⭐</span>
            <div className="min-w-0">
              <p className="m-0 text-xs text-gold/70 truncate">Stars</p>
              <p className="m-0 text-sm font-semibold text-gold truncate">{starsCompact}</p>
            </div>
            {/* Quick Top-Up Button */}
            {onShopClick && (
              <motion.button
                onClick={onShopClick}
                className="flex-shrink-0 ml-1 w-6 h-6 rounded-full flex items-center justify-center bg-gold/20 hover:bg-gold/30 border border-gold/40 hover:border-gold/60 transition-all duration-200 text-gold cursor-pointer"
                title="Quick Top-Up Stars"
                type="button"
                aria-label="Quick Top-Up Stars"
                whileHover={{ scale: 1.2, backgroundColor: 'rgba(255, 201, 87, 0.35)' }}
                whileTap={{ scale: 0.85 }}
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <span className="text-xs font-bold">+</span>
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
              className="flex-shrink-0 px-3 py-2 rounded-md bg-gradient-to-r from-gold/20 to-orange/20 hover:from-gold/30 hover:to-orange/30 border border-gold/30 hover:border-gold/50 transition-all duration-200 text-sm font-medium text-gold active:scale-95"
              title="Top-up Stars"
              type="button"
              aria-label="Top-up Stars"
            >
              <span className="text-sm">🛍️</span>
            </button>
          )}

          {/* Settings Button */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 p-2 rounded-md hover:bg-white/10 transition-colors duration-150 hover:text-cyan"
              title="Settings"
              aria-label="Settings"
              type="button"
            >
              <span className="text-lg">⚙️</span>
            </button>
          )}
        </div>
      </div>

      {/* Level progress bar at bottom */}
      {xpProgress !== undefined && (
        <LevelBar
          progress={xpProgress}
          xpCurrent={undefined}
          xpTotal={undefined}
        />
      )}
    </header>
  );
}
