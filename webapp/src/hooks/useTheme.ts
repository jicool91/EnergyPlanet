import { useEffect, useMemo, useRef, useState } from 'react';
import { getTmaThemeSnapshot, onTmaThemeChange } from '@/services/tma/theme';
import type { ThemeSnapshot } from '@/utils/telegramTheme';
import { logClientEvent } from '@/services/telemetry';

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

export function useTheme() {
  const [theme, setTheme] = useState<ThemeSnapshot>(() => getTmaThemeSnapshot());
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() =>
    getBrowserColorSchemeFallback()
  );
  const lastTelemetryRef = useRef({
    headerColor: theme.header_color ?? theme.bg_color,
    colorScheme,
    timestamp: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  });

  useEffect(() => {
    const unsubscribe = onTmaThemeChange(nextTheme => {
      setTheme(nextTheme);
      setColorScheme(getBrowserColorSchemeFallback());
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
