import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  getCachedSafeArea,
  getCachedViewportMetrics,
  getTmaSafeAreaSnapshot,
  getTmaViewportMetrics,
  onTmaSafeAreaChange,
  onTmaViewportChange,
  type SafeAreaSnapshot,
  type ViewportMetrics,
} from '@/services/tma/viewport';
import { HEADER_BUFFER_PX } from '@/constants/layout';
import { isTmaSdkAvailable } from '@/services/tma/core';
import { logger } from '@/utils/logger';
import { logClientEvent } from '@/services/telemetry';

type SafeAreaResult = {
  safeArea: SafeAreaSnapshot;
  viewport: ViewportMetrics;
  headerInset: number;
  contentInset: number;
  safeTopWithBuffer: number;
  isFullscreen: boolean;
  isExpanded: boolean;
};

const subscribeSafeArea = (callback: () => void) => onTmaSafeAreaChange(() => callback());
const subscribeViewport = (callback: () => void) => onTmaViewportChange(() => callback());

const getSafeAreaSnapshot = () => getCachedSafeArea() ?? getTmaSafeAreaSnapshot();
const getViewportSnapshot = () => getCachedViewportMetrics() ?? getTmaViewportMetrics();

const clampInset = (value?: number | null) => Math.max(0, value ?? 0);

const SAFE_AREA_TELEMETRY_THRESHOLD_PX = 6;
const SAFE_AREA_TELEMETRY_INTERVAL_MS = 30_000;
const SAFE_AREA_STATS_WINDOW_KEY = '__safeAreaStats';

/**
 * Reactive safe-area + viewport snapshot that stays in sync with Telegram Mini App events.
 * Returns memoized layout insets so layout consumers avoid recalculating padding on every render.
 */
export function useSafeArea(): SafeAreaResult {
  const safeArea = useSyncExternalStore(
    subscribeSafeArea,
    getSafeAreaSnapshot,
    getSafeAreaSnapshot
  );
  const viewport = useSyncExternalStore(
    subscribeViewport,
    getViewportSnapshot,
    getViewportSnapshot
  );

  const lastTelemetryRef = useRef({
    safeTop: clampInset(safeArea.safe.top),
    contentTop: clampInset(safeArea.content.top),
    isFullscreen: Boolean(viewport.isFullscreen),
    timestamp: 0,
  });

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === 'undefined') {
      return;
    }

    if (!isTmaSdkAvailable()) {
      logger.warn(
        'useSafeArea mounted before TMA SDK became available. Check initialization order.'
      );
    }
  }, []);

  useEffect(() => {
    const safeTop = clampInset(safeArea.safe.top);
    const contentTop = clampInset(safeArea.content.top);
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (typeof window !== 'undefined') {
      const stats = (window as Window & { [SAFE_AREA_STATS_WINDOW_KEY]?: unknown })[
        SAFE_AREA_STATS_WINDOW_KEY
      ] as
        | {
            samples: number;
            lastSafeTop?: number;
            lastContentTop?: number;
          }
        | undefined;
      const nextStats = {
        samples: (stats?.samples ?? 0) + 1,
        lastSafeTop: safeTop,
        lastContentTop: contentTop,
      };
      (window as Window & { [SAFE_AREA_STATS_WINDOW_KEY]?: typeof nextStats })[
        SAFE_AREA_STATS_WINDOW_KEY
      ] = nextStats;
    }

    const last = lastTelemetryRef.current;
    const safeDelta = Math.abs(safeTop - last.safeTop);
    const contentDelta = Math.abs(contentTop - last.contentTop);
    const modeChanged = Boolean(viewport.isFullscreen) !== Boolean(last.isFullscreen);
    const elapsed = now - last.timestamp;
    const thresholdBreached = safeDelta >= SAFE_AREA_TELEMETRY_THRESHOLD_PX;
    const shouldEmit =
      thresholdBreached ||
      contentDelta >= SAFE_AREA_TELEMETRY_THRESHOLD_PX ||
      modeChanged ||
      elapsed >= SAFE_AREA_TELEMETRY_INTERVAL_MS;

    if (shouldEmit) {
      lastTelemetryRef.current = {
        safeTop,
        contentTop,
        isFullscreen: Boolean(viewport.isFullscreen),
        timestamp: now,
      };

      void logClientEvent(
        'safe_area_hook_sample',
        {
          safe_top: safeTop,
          content_top: contentTop,
          safe_delta: safeDelta,
          content_delta: contentDelta,
          is_fullscreen: Boolean(viewport.isFullscreen),
          is_expanded: Boolean(viewport.isExpanded),
          viewport_height: viewport.height ?? undefined,
          viewport_stable_height: viewport.stableHeight ?? undefined,
        },
        thresholdBreached ? 'warn' : 'info'
      );
    }
  }, [safeArea, viewport]);

  const derived = useMemo(() => {
    const deviceInsetTop = clampInset(safeArea.safe.top);
    const telegramInsetTop = clampInset(safeArea.content.top);
    const headerInset = deviceInsetTop + telegramInsetTop;
    const safeTopWithBuffer = headerInset + HEADER_BUFFER_PX;

    return {
      headerInset,
      contentInset: telegramInsetTop,
      safeTopWithBuffer,
      isFullscreen: Boolean(viewport.isFullscreen),
      isExpanded: Boolean(viewport.isExpanded),
    };
  }, [safeArea, viewport]);

  return {
    safeArea,
    viewport,
    ...derived,
  };
}
