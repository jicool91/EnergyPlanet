import { useMemo } from 'react';
import { viewport } from '@tma.js/sdk';
import { useSignal } from '@tma.js/sdk-react';
import {
  getTmaSafeAreaSnapshot,
  getTmaViewportMetrics,
  type SafeAreaSnapshot,
  type ViewportMetrics,
} from '@/services/tma/viewport';

interface ViewportSignal {
  safeArea: SafeAreaSnapshot;
  metrics: ViewportMetrics;
}

export function useViewportSignal(): ViewportSignal {
  const snapshot = useSignal(viewport.state, () => ({
    safeArea: getTmaSafeAreaSnapshot(),
    metrics: getTmaViewportMetrics(),
  }));

  return useMemo(
    () => ({
      safeArea: snapshot.safeArea,
      metrics: snapshot.metrics,
    }),
    [snapshot]
  );
}
