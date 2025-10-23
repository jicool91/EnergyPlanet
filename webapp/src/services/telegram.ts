import {
  DEFAULT_THEME,
  initializeTelegramTheme,
  updateThemeVariables,
  type TelegramThemeParams,
} from '../utils/telegramTheme';

export { DEFAULT_THEME } from '../utils/telegramTheme';
export type { TelegramThemeParams } from '../utils/telegramTheme';

/**
 * Telegram WebApp integration helpers.
 * Encapsulates initialization, theme management, haptics and back button helpers.
 */

type TelegramSafeArea = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type TelegramWebAppEvents =
  | 'themeChanged'
  | 'viewportChanged'
  | 'backButtonClicked'
  | 'safe_area_changed';

type TelegramHapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type TelegramHapticNotification = 'error' | 'success' | 'warning';

interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: TelegramHapticStyle) => void;
  notificationOccurred: (type: TelegramHapticNotification) => void;
  selectionChanged: () => void;
}

interface TelegramViewportEvent {
  isStateStable: boolean;
  isExpanded: boolean;
  height: number;
  width: number;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: unknown;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: TelegramThemeParams;
  safeAreaInset?: TelegramSafeArea;
  contentSafeAreaInset?: TelegramSafeArea;
  viewportHeight?: number;
  viewportStableHeight?: number;
  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableVerticalSwipes(): void;
  isClosingConfirmationEnabled: boolean;
  isExpanded?: boolean;
  openInvoice?: (slug: string, callback?: (status?: unknown) => void) => Promise<unknown>;
  onEvent<EventName extends TelegramWebAppEvents>(
    eventType: EventName,
    handler: EventName extends 'viewportChanged'
      ? (event: TelegramViewportEvent) => void
      : EventName extends 'safe_area_changed'
        ? (inset: TelegramSafeArea) => void
        : () => void
  ): void;
  offEvent<EventName extends TelegramWebAppEvents>(
    eventType: EventName,
    handler: EventName extends 'viewportChanged'
      ? (event: TelegramViewportEvent) => void
      : EventName extends 'safe_area_changed'
        ? (inset: TelegramSafeArea) => void
        : () => void
  ): void;
  BackButton?: TelegramBackButton;
  HapticFeedback?: TelegramHapticFeedback;
  setHeaderColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

type ThemeListener = (theme: TelegramThemeParams) => void;

let initialized = false;
const themeListeners = new Set<ThemeListener>();
let currentTheme: TelegramThemeParams = { ...DEFAULT_THEME };

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.Telegram?.WebApp ?? null;
}

function updateTelegramChrome(theme: TelegramThemeParams) {
  const webApp = getWebApp();
  if (!webApp) {
    return;
  }

  if (theme.header_color && typeof webApp.setHeaderColor === 'function') {
    webApp.setHeaderColor(theme.header_color);
  }
  if (theme.bottom_bar_color && typeof webApp.setBottomBarColor === 'function') {
    webApp.setBottomBarColor(theme.bottom_bar_color);
  }
}

function emitTheme(theme: TelegramThemeParams) {
  themeListeners.forEach(listener => {
    try {
      listener(theme);
    } catch (error) {
      console.warn('Theme listener threw an error', error);
    }
  });
}

function applyThemeFromParams(
  theme: TelegramThemeParams | undefined,
  options: { initialize?: boolean } = {}
) {
  const resolver = options.initialize ? initializeTelegramTheme : updateThemeVariables;
  const resolved = resolver(theme);
  currentTheme = resolved;
  updateTelegramChrome(resolved);
  emitTheme(resolved);
}

function applySafeArea(options: { safe?: TelegramSafeArea; content?: TelegramSafeArea }) {
  const root = document.documentElement;
  const safe = options.safe ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const content = options.content ?? safe;

  root.style.setProperty('--tg-safe-area-top', `${safe.top}px`);
  root.style.setProperty('--tg-safe-area-right', `${safe.right}px`);
  root.style.setProperty('--tg-safe-area-bottom', `${safe.bottom}px`);
  root.style.setProperty('--tg-safe-area-left', `${safe.left}px`);

  root.style.setProperty('--tg-content-safe-area-top', `${content.top}px`);
  root.style.setProperty('--tg-content-safe-area-right', `${content.right}px`);
  root.style.setProperty('--tg-content-safe-area-bottom', `${content.bottom}px`);
  root.style.setProperty('--tg-content-safe-area-left', `${content.left}px`);
}

function applyViewportVars(webApp: TelegramWebApp | null) {
  const root = document.documentElement;
  if (!webApp) {
    return;
  }

  if (typeof webApp.viewportHeight === 'number') {
    root.style.setProperty('--tg-viewport-height', `${webApp.viewportHeight}px`);
  }

  if (typeof webApp.viewportStableHeight === 'number') {
    root.style.setProperty('--tg-viewport-stable-height', `${webApp.viewportStableHeight}px`);
  }
}

/**
 * Initialize Telegram WebApp integrations.
 * Safe to call multiple times.
 */
export function initializeTelegramWebApp(): void {
  if (initialized) {
    return;
  }

  const webApp = getWebApp();
  if (!webApp) {
    applyThemeFromParams(undefined, { initialize: true });
    initialized = true;
    return;
  }

  try {
    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes();
    applyThemeFromParams(webApp.themeParams, { initialize: true });
    applySafeArea({
      safe: webApp.safeAreaInset,
      content: webApp.contentSafeAreaInset,
    });
    applyViewportVars(webApp);

    const handleThemeChange = () => applyThemeFromParams(webApp.themeParams);
    const handleViewportChange = (event: TelegramViewportEvent) => {
      if (!event.isExpanded) {
        webApp.expand();
      }
      applyViewportVars(webApp);
    };
    const handleSafeAreaChange = () => {
      applySafeArea({
        safe: webApp.safeAreaInset,
        content: webApp.contentSafeAreaInset,
      });
    };

    webApp.onEvent('themeChanged', handleThemeChange);
    webApp.onEvent('viewportChanged', handleViewportChange);
    webApp.onEvent('safe_area_changed', handleSafeAreaChange);

    initialized = true;
  } catch (error) {
    console.warn('Telegram WebApp initialization failed', error);
    applyThemeFromParams(undefined);
    initialized = true;
  }
}

export function getTelegramInitData(): string {
  return getWebApp()?.initData ?? '';
}

export function triggerHapticImpact(style: TelegramHapticStyle = 'light'): void {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred(style);
  } catch (error) {
    // Silently ignore haptic failures
    if (import.meta.env.DEV) {
      console.debug('Haptic impact not available', error);
    }
  }
}

export function triggerHapticNotification(type: TelegramHapticNotification): void {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred(type);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('Haptic notification not available', error);
    }
  }
}

export function onTelegramThemeChange(listener: ThemeListener): () => void {
  themeListeners.add(listener);
  listener(currentTheme);

  return () => {
    themeListeners.delete(listener);
  };
}

export function withTelegramBackButton(handler: () => void): () => void {
  const webApp = getWebApp();
  if (!webApp?.BackButton) {
    return () => undefined;
  }

  webApp.BackButton.onClick(handler);
  if (!webApp.BackButton.isVisible) {
    webApp.BackButton.show();
  }

  return () => {
    webApp.BackButton?.offClick(handler);
    webApp.BackButton?.hide();
  };
}

export function isTelegramAvailable(): boolean {
  return Boolean(getWebApp());
}
