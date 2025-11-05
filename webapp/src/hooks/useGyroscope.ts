import { useEffect, useMemo, useState } from 'react';
import { usePreferencesStore } from '@/store/preferencesStore';
import {
  isGyroscopeSupported,
  subscribeGyroscope,
  type GyroscopeOptions,
  type GyroscopeVector,
} from '@/services/tma/motion';

type UseGyroscopeOptions = GyroscopeOptions & {
  enabled?: boolean;
};

export function useGyroscope({
  enabled = true,
  refreshRate,
}: UseGyroscopeOptions = {}): GyroscopeVector | null {
  const reduceMotion = usePreferencesStore(state => state.reduceMotion);
  const [vector, setVector] = useState<GyroscopeVector | null>(null);

  const shouldSubscribe = useMemo(
    () => enabled && !reduceMotion && isGyroscopeSupported(),
    [enabled, reduceMotion]
  );

  useEffect(() => {
    if (!shouldSubscribe) {
      return;
    }

    const unsubscribe = subscribeGyroscope(setVector, { refreshRate });
    return () => {
      unsubscribe();
    };
  }, [shouldSubscribe, refreshRate]);

  if (!shouldSubscribe) {
    return null;
  }

  return vector;
}
