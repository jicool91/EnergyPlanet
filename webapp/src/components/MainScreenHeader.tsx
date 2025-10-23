/**
 * Main Screen Header Component
 * Compact header for all screens with essential info
 *
 * Features:
 * - Level display
 * - Energy counter
 * - XP progress indicator (optional)
 * - Settings/Profile quick access
 * - Fixed position, compact height (max 60px)
 *
 * Usage:
 * ```tsx
 * <MainScreenHeader
 *   level={15}
 *   energy={50000}
 *   xpProgress={0.65}
 *   onSettingsClick={() => setActiveTab('settings')}
 * />
 * ```
 */

import { useMemo } from 'react';
import { formatCompactNumber } from '../utils/number';

interface MainScreenHeaderProps {
  level: number;
  energy: number;
  xpProgress?: number; // 0-1
  onSettingsClick?: () => void;
}

export function MainScreenHeader({
  level,
  energy,
  xpProgress,
  onSettingsClick,
}: MainScreenHeaderProps) {
  const energyCompact = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);

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
        </div>

        {/* Right: XP Progress + Settings */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* XP Progress Bar (optional, compact) */}
          {xpProgress !== undefined && (
            <div className="hidden sm:flex flex-col items-center gap-1">
              <span className="text-xs text-white/60">XP</span>
              <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-lime transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, xpProgress * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Settings Button */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="flex-shrink-0 p-2 rounded-md hover:bg-white/5 transition-colors"
              aria-label="Settings"
              type="button"
            >
              <span className="text-lg">⚙️</span>
            </button>
          )}
        </div>
      </div>

      {/* Thin XP progress bar at bottom (mobile) */}
      {xpProgress !== undefined && (
        <div className="sm:hidden h-0.5 bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan via-lime to-gold transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, xpProgress * 100))}%` }}
          />
        </div>
      )}
    </header>
  );
}
