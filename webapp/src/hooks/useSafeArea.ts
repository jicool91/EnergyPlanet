import { useEffect, useState } from 'react';
import {
  getCurrentSafeArea,
  getViewportMetrics,
  onTelegramSafeAreaChange,
  onTelegramViewportChange,
  type SafeAreaSnapshot,
  type ViewportMetrics,
} from '../services/telegram';
import { isTmaFeatureEnabled } from '@/config/tmaFlags';
import {
  getTmaSafeAreaSnapshot,
  getTmaViewportMetrics,
  onTmaSafeAreaChange,
  onTmaViewportChange,
} from '@/services/tma/viewport';

type SafeAreaResult = {
  safeArea: SafeAreaSnapshot;
  viewport: ViewportMetrics;
};

function useSafeAreaLegacy(): SafeAreaResult {
  const [safeArea, setSafeArea] = useState<SafeAreaSnapshot>(() => getCurrentSafeArea());
  const [viewport, setViewport] = useState<ViewportMetrics>(() => getViewportMetrics());

  useEffect(() => {
    const offSafe = onTelegramSafeAreaChange(setSafeArea);
    const offViewport = onTelegramViewportChange(setViewport);

    return () => {
      offSafe();
      offViewport();
    };
  }, []);

  return {
    safeArea,
    viewport,
  };
}

function useSafeAreaTma(): SafeAreaResult {
  const [safeArea, setSafeArea] = useState<SafeAreaSnapshot>(() => getTmaSafeAreaSnapshot());
  const [viewport, setViewport] = useState<ViewportMetrics>(() => getTmaViewportMetrics());

  useEffect(() => {
    const offSafe = onTmaSafeAreaChange(setSafeArea);
    const offViewport = onTmaViewportChange(setViewport);

    return () => {
      offSafe();
      offViewport();
    };
  }, []);

  return {
    safeArea,
    viewport,
  };
}

const useSafeAreaImpl = isTmaFeatureEnabled('safeArea') ? useSafeAreaTma : useSafeAreaLegacy;

export function useSafeArea(): SafeAreaResult {
  return useSafeAreaImpl();
}
