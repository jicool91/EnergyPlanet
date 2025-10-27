import { miniApp, themeParams } from '@tma.js/sdk';
import type { ThemeParams as TmaThemeParams } from '@tma.js/types';
import {
  TELEGRAM_THEME_VARIABLES,
  updateThemeVariables,
  type TelegramThemeParams,
} from '@/utils/telegramTheme';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

type ThemeListener = (theme: TelegramThemeParams) => void;

const THEME_KEYS = Object.keys(TELEGRAM_THEME_VARIABLES) as Array<
  keyof typeof TELEGRAM_THEME_VARIABLES
>;

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

function readAndApplyTheme(): TelegramThemeParams {
  const raw = themeParams.state();
  return updateThemeVariables(mapTmaThemeParams(raw));
}

export function getTmaThemeSnapshot(): TelegramThemeParams {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return updateThemeVariables(undefined);
  }
  return readAndApplyTheme();
}

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
