import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_THEME,
  onTelegramThemeChange,
  TelegramThemeParams,
} from '../services/telegram';

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

function getInitialTheme(): TelegramThemeParams {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME;
  }

  const themeParams = window.Telegram?.WebApp?.themeParams;
  return { ...DEFAULT_THEME, ...(themeParams ?? {}) };
}

export function useTheme() {
  const [theme, setTheme] = useState<TelegramThemeParams>(() => getInitialTheme());
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => getBrowserColorSchemeFallback());

  useEffect(() => {
    const unsubscribe = onTelegramThemeChange(nextTheme => {
      setTheme(nextTheme);
      setColorScheme(getBrowserColorSchemeFallback());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isDark = useMemo(() => colorScheme === 'dark', [colorScheme]);

  return {
    theme,
    colorScheme,
    isDark,
  };
}
