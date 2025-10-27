import { useEffect, useState } from 'react';
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

type SafeAreaResult = {
  safeArea: SafeAreaSnapshot;
  viewport: ViewportMetrics;
};

export function useSafeArea(): SafeAreaResult {
  const [safeArea, setSafeArea] = useState<SafeAreaSnapshot>(() => {
    const cached = getCachedSafeArea();
    return cached ?? getTmaSafeAreaSnapshot();
  });
  const [viewport, setViewport] = useState<ViewportMetrics>(() => {
    const cached = getCachedViewportMetrics();
    return cached ?? getTmaViewportMetrics();
  });

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
