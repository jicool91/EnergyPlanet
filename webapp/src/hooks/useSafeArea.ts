import { useEffect, useState } from 'react';
import {
  getCurrentSafeArea,
  getViewportMetrics,
  onTelegramSafeAreaChange,
  onTelegramViewportChange,
  type SafeAreaSnapshot,
  type ViewportMetrics,
} from '../services/telegram';

export function useSafeArea(): {
  safeArea: SafeAreaSnapshot;
  viewport: ViewportMetrics;
} {
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
