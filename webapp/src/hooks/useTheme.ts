import { useEffect, useMemo, useState } from 'react';
import { onTelegramThemeChange } from '../services/telegram';
import { getResolvedTelegramTheme, type TelegramThemeParams } from '../utils/telegramTheme';

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
  return getResolvedTelegramTheme();
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
