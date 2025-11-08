import { useEffect, useMemo, useRef } from 'react';
import { logClientEvent } from '@/services/telemetry';
import { useThemeSignal } from './useThemeSignal';

type ColorScheme = 'light' | 'dark';

function getBrowserColorSchemeFallback(): ColorScheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  if (window.Telegram?.WebApp?.colorScheme === 'dark') {
    return 'dark';
  }

  if (window.Telegram?.WebApp?.colorScheme === 'light') {
    return 'light';
  }

  const dataScheme = document.documentElement.dataset.colorScheme;
  if (dataScheme === 'dark' || dataScheme === 'light') {
    return dataScheme;
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const THEME_HOOK_INTERVAL_MS = 60_000;

/**
 * Synchronizes Telegram theme params with CSS variables and emits telemetry samples.
 * Provides derived color scheme data so UI components can reactively style themselves.
 */
export function useTheme() {
  const { theme } = useThemeSignal();
  const colorScheme = getBrowserColorSchemeFallback();
  const lastTelemetryRef = useRef({
    headerColor: theme.header_color ?? theme.bg_color,
    colorScheme,
    timestamp: 0,
  });

  useEffect(() => {
    const headerColor = theme.header_color ?? theme.bg_color;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();

    if (typeof window !== 'undefined') {
      window.__themeStats = {
        samples: (window.__themeStats?.samples ?? 0) + 1,
        lastScheme: colorScheme,
        lastHeaderColor: headerColor,
      };
    }

    const last = lastTelemetryRef.current;
    const schemeChanged = last.colorScheme !== colorScheme;
    const headerChanged = last.headerColor !== headerColor;
    const elapsed = now - last.timestamp;
    if (schemeChanged || headerChanged || elapsed >= THEME_HOOK_INTERVAL_MS) {
      lastTelemetryRef.current = {
        headerColor,
        colorScheme,
        timestamp: now,
      };

      void logClientEvent('theme_hook_update', {
        color_scheme: colorScheme,
        header_color: headerColor,
        bottom_bar_color: theme.bottom_bar_color ?? theme.bg_color,
      });
    }
  }, [theme, colorScheme]);

  const isDark = useMemo(() => colorScheme === 'dark', [colorScheme]);

  return {
    theme,
    colorScheme,
    isDark,
  };
}
