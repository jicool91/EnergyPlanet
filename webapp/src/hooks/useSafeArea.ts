import { useEffect, useMemo, useSyncExternalStore } from 'react';
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
