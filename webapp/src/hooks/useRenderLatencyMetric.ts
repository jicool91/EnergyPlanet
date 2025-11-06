import { useEffect, useMemo, useRef } from 'react';
import { logClientEvent } from '@/services/telemetry';

type RenderLatencyContext = Record<string, unknown>;

function resolveColorScheme(): 'light' | 'dark' | 'unknown' {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const explicit = document.documentElement.dataset.colorScheme;
  if (explicit === 'light' || explicit === 'dark') {
    return explicit;
  }

  const tgScheme = window.Telegram?.WebApp?.colorScheme;
  if (tgScheme === 'light' || tgScheme === 'dark') {
    return tgScheme;
  }

  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'unknown';
}

function resolveDeviceClass(): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  if (typeof window === 'undefined') {
    return 'unknown';
  }

  const width = window.innerWidth;
  if (width <= 0) {
    return 'unknown';
  }

  if (width < 640) {
    return 'mobile';
  }

  if (width < 1024) {
    return 'tablet';
  }

  return 'desktop';
}

export function useRenderLatencyMetric(options: {
  screen: string;
  context?: RenderLatencyContext;
  enabled?: boolean;
}) {
  const { screen, context, enabled = true } = options;
  const startMarkRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || startMarkRef.current !== null) {
      return;
    }
    if (typeof performance === 'undefined') {
      return;
    }
    startMarkRef.current = performance.now();
  }, [enabled]);

  const staticContext = useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        theme: 'unknown' as const,
        device_class: 'unknown' as const,
        user_agent: 'server',
      };
    }

    return {
      theme: resolveColorScheme(),
      device_class: resolveDeviceClass(),
      user_agent: window.navigator?.userAgent ?? 'unknown',
    };
  }, []);

  useEffect(() => {
    if (!enabled || startMarkRef.current === null || typeof performance === 'undefined') {
      return;
    }

    const latency = Math.max(0, Math.round(performance.now() - startMarkRef.current));

    void logClientEvent('render_latency', {
      screen,
      render_latency_ms: latency,
      ...staticContext,
      ...context,
    });
  }, [context, enabled, screen, staticContext]);
}
