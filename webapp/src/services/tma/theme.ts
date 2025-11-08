import { miniApp, themeParams } from '@tma.js/sdk';
import type { ThemeParams as TmaThemeParams } from '@tma.js/types';
import {
  TELEGRAM_THEME_VARIABLES,
  updateThemeVariables,
  type ThemeSnapshot,
  type TelegramThemeParams,
} from '@/utils/telegramTheme';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

type ThemeListener = (theme: ThemeSnapshot) => void;

const THEME_KEYS = Object.keys(TELEGRAM_THEME_VARIABLES) as Array<
  keyof typeof TELEGRAM_THEME_VARIABLES
>;

function applyFontScale(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const webApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;
  let scale: number | undefined;

  if (webApp) {
    const directScale = (webApp as { fontScale?: number | string }).fontScale;
    if (typeof directScale === 'number') {
      scale = directScale;
    } else if (typeof directScale === 'string') {
      const parsed = Number.parseFloat(directScale);
      if (Number.isFinite(parsed)) {
        scale = parsed;
      }
    }

    if (scale === undefined && typeof webApp.settings === 'object' && webApp.settings !== null) {
      const settingsScale = (webApp.settings as { font_scale?: number | string }).font_scale;
      if (typeof settingsScale === 'number') {
        scale = settingsScale;
      } else if (typeof settingsScale === 'string') {
        const parsed = Number.parseFloat(settingsScale);
        if (Number.isFinite(parsed)) {
          scale = parsed;
        }
      }
    }
  }

  const resolved =
    Number.isFinite(scale) && (scale as number) > 0 ? Math.min(scale as number, 1.6) : 1;
  root.style.setProperty('--tg-text-size-scale', resolved.toString());
  root.dataset.tgTextScale = resolved.toString();
}

function mapTmaThemeParams(params: TmaThemeParams | undefined): TelegramThemeParams {
  const result: TelegramThemeParams = {};

  if (params) {
    THEME_KEYS.forEach(key => {
      const value = params[key];
      if (typeof value === 'string') {
        result[key] = value;
      }
    });
  }

  const headerColor = miniApp.headerColor();
  if (typeof headerColor === 'string') {
    result.header_color = headerColor;
  }

  const bottomBarColor = miniApp.bottomBarColor();
  if (typeof bottomBarColor === 'string') {
    result.bottom_bar_color = bottomBarColor;
  }

  return result;
}

function readAndApplyTheme(): ThemeSnapshot {
  const raw = themeParams.state();
  applyFontScale();
  return updateThemeVariables(mapTmaThemeParams(raw));
}

/**
 * Resolves the latest Telegram theme, applies CSS variables + font scale, and returns a snapshot
 * that can be cached by hooks before listeners are attached.
 */
export function getTmaThemeSnapshot(): ThemeSnapshot {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    applyFontScale();
    return updateThemeVariables(undefined);
  }
  return readAndApplyTheme();
}

/**
 * Subscribes to Telegram theme parameter updates (including miniApp header/background events)
 * and applies CSS variables before invoking the provided listener.
 */
export function onTmaThemeChange(listener: ThemeListener): VoidFunction {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    const fallback = updateThemeVariables(undefined);
    listener(fallback);
    return () => {};
  }

  const emit = () => listener(readAndApplyTheme());
  const unsubscribeTheme = themeParams.state.sub(emit);
  const unsubscribeMiniApp = miniApp.state.sub(emit);

  emit();

  return () => {
    unsubscribeTheme();
    unsubscribeMiniApp();
  };
}
