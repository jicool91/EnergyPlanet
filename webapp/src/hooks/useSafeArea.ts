import { useEffect } from 'react';
import type { TelegramWebApp } from '../services/telegram';

const SAFE_TOP_VAR = '--app-safe-top';
const SAFE_RIGHT_VAR = '--app-safe-right';
const SAFE_BOTTOM_VAR = '--app-safe-bottom';
const SAFE_LEFT_VAR = '--app-safe-left';
const CONTENT_TOP_VAR = '--app-content-safe-top';
const CONTENT_RIGHT_VAR = '--app-content-safe-right';
const CONTENT_BOTTOM_VAR = '--app-content-safe-bottom';
const CONTENT_LEFT_VAR = '--app-content-safe-left';
const VIEWPORT_HEIGHT_VAR = '--app-viewport-height';
const VIEWPORT_STABLE_HEIGHT_VAR = '--app-viewport-stable-height';
const MAIN_BUTTON_HEIGHT_VAR = '--app-main-button-height';

const FALLBACK_TOP = 'env(safe-area-inset-top, 0px)';
const FALLBACK_BOTTOM = 'env(safe-area-inset-bottom, 0px)';
const FALLBACK_RIGHT = 'env(safe-area-inset-right, 0px)';
const FALLBACK_LEFT = 'env(safe-area-inset-left, 0px)';
const DEFAULT_MAIN_BUTTON_HEIGHT = 72;

const setCssVar = (name: string, value: string) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.style.setProperty(name, value);
};

const formatInset = (value: number | undefined, fallback: string) => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return `${value}px`;
  }
  return fallback;
};

const readMainButton = () => {
  const webApp = window.Telegram?.WebApp as
    | (TelegramWebApp & { MainButton?: { height?: number; isVisible?: boolean | (() => boolean) } })
    | undefined;
  if (!webApp) {
    return { visible: false, height: 0 };
  }

  let visible = false;
  const rawVisibility = webApp.MainButton?.isVisible;
  if (typeof rawVisibility === 'boolean') {
    visible = rawVisibility;
  } else if (typeof rawVisibility === 'function') {
    try {
      visible = Boolean((rawVisibility as () => boolean)());
    } catch {
      visible = false;
    }
  }

  let height = 0;
  if (visible) {
    const rawHeight = webApp.MainButton?.height;
    if (typeof rawHeight === 'number' && Number.isFinite(rawHeight) && rawHeight > 0) {
      height = rawHeight;
    } else {
      height = DEFAULT_MAIN_BUTTON_HEIGHT;
    }
  }

  return { visible, height };
};

const applyInsets = () => {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) {
    return;
  }

  const safe = webApp.safeAreaInset;
  const content = webApp.contentSafeAreaInset;

  setCssVar(SAFE_TOP_VAR, formatInset(safe?.top, FALLBACK_TOP));
  setCssVar(SAFE_RIGHT_VAR, formatInset(safe?.right, FALLBACK_RIGHT));
  setCssVar(SAFE_BOTTOM_VAR, formatInset(safe?.bottom, FALLBACK_BOTTOM));
  setCssVar(SAFE_LEFT_VAR, formatInset(safe?.left, FALLBACK_LEFT));

  setCssVar(CONTENT_TOP_VAR, formatInset(content?.top, FALLBACK_TOP));
  setCssVar(CONTENT_RIGHT_VAR, formatInset(content?.right, FALLBACK_RIGHT));
  setCssVar(CONTENT_BOTTOM_VAR, formatInset(content?.bottom, FALLBACK_BOTTOM));
  setCssVar(CONTENT_LEFT_VAR, formatInset(content?.left, FALLBACK_LEFT));

  setCssVar(
    VIEWPORT_HEIGHT_VAR,
    typeof webApp.viewportHeight === 'number' ? `${webApp.viewportHeight}px` : '100vh'
  );
  setCssVar(
    VIEWPORT_STABLE_HEIGHT_VAR,
    typeof webApp.viewportStableHeight === 'number'
      ? `${webApp.viewportStableHeight}px`
      : '100vh'
  );

  const { height } = readMainButton();
  setCssVar(MAIN_BUTTON_HEIGHT_VAR, `${height}px`);
};

export const useSafeArea = () => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    applyInsets();

    const safeHandler = () => applyInsets();
    const viewportHandler = () => applyInsets();

    const webApp = window.Telegram?.WebApp;
    try {
      webApp?.onEvent?.('safe_area_changed', safeHandler);
      webApp?.onEvent?.('content_safe_area_changed', safeHandler);
      webApp?.onEvent?.('viewportChanged', viewportHandler);
    } catch {
      /** noop */
    }

    return () => {
      try {
        webApp?.offEvent?.('safe_area_changed', safeHandler);
        webApp?.offEvent?.('content_safe_area_changed', safeHandler);
        webApp?.offEvent?.('viewportChanged', viewportHandler);
      } catch {
        /** noop */
      }
    };
  }, []);
};
