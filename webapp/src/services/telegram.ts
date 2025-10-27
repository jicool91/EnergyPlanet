import type {
  MainButton as TelegramSdkMainButton,
  SafeAreaInset as TelegramSafeArea,
  WebApp as TelegramWebApp,
} from '@twa-dev/types';
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

type TelegramHapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type TelegramHapticNotification = 'error' | 'success' | 'warning';

type TelegramMainButton = TelegramSdkMainButton & {
  setColor?: (color: string) => TelegramSdkMainButton;
  setTextColor?: (color: string) => TelegramSdkMainButton;
};

type TelegramCloudStorage = {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  getKeys?: () => Promise<string[]>;
  getItems?: (keys: string[]) => Promise<Record<string, string>>;
};

type TelegramViewportEvent = {
  isStateStable?: boolean;
  isExpanded?: boolean;
  height?: number;
  width?: number;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

type ThemeListener = (theme: TelegramThemeParams) => void;
type SafeAreaListener = (insets: SafeAreaSnapshot) => void;
type ViewportListener = (metrics: ViewportMetrics) => void;
type MainButtonHandler = () => void;

export type SafeAreaSnapshot = {
  safe: TelegramSafeArea;
  content: TelegramSafeArea;
};

export type ViewportMetrics = {
  height: number | null;
  stableHeight: number | null;
  width: number | null;
  isExpanded: boolean;
  isStateStable: boolean;
};

const ZERO_SAFE_AREA: TelegramSafeArea = { top: 0, right: 0, bottom: 0, left: 0 };

let initialized = false;
const themeListeners = new Set<ThemeListener>();
const safeAreaListeners = new Set<SafeAreaListener>();
const viewportListeners = new Set<ViewportListener>();
const mainButtonHandlers = new Set<MainButtonHandler>();
const fullscreenListeners = new Set<(isFullscreen: boolean) => void>();
let currentTheme: TelegramThemeParams = { ...DEFAULT_THEME };
let currentSafeArea: SafeAreaSnapshot = { safe: ZERO_SAFE_AREA, content: ZERO_SAFE_AREA };
let currentViewport: ViewportMetrics = {
  height: typeof window !== 'undefined' ? window.innerHeight : null,
  stableHeight: typeof window !== 'undefined' ? window.innerHeight : null,
  width: typeof window !== 'undefined' ? window.innerWidth : null,
  isExpanded: true,
  isStateStable: true,
};
let currentFullscreen = false;

let cachedWebApp: TelegramWebApp | null = null;
let sdkLoadRequested = false;

function getGlobalWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.Telegram?.WebApp ?? null;
}

function ensureTelegramSdkRequested() {
  if (sdkLoadRequested || typeof window === 'undefined') {
    return;
  }

  sdkLoadRequested = true;
  void import('@twa-dev/sdk')
    .then(module => {
      cachedWebApp = module.default ?? getGlobalWebApp();
    })
    .catch(error => {
      if (import.meta?.env?.DEV) {
        console.debug('Failed to load @twa-dev/sdk', error);
      }
      cachedWebApp = getGlobalWebApp();
    });
}

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  ensureTelegramSdkRequested();

  if (cachedWebApp) {
    return cachedWebApp;
  }

  cachedWebApp = getGlobalWebApp();
  return cachedWebApp;
}

function getMainButton(): TelegramMainButton | null {
  const mainButton = getWebApp()?.MainButton;
  if (!mainButton) {
    return null;
  }
  return mainButton as TelegramMainButton;
}

function resolveTelegramColorToken(
  value?: string
): `#${string}` | 'bg_color' | 'secondary_bg_color' | null {
  if (!value) {
    return null;
  }

  if (value === 'bg_color' || value === 'secondary_bg_color') {
    return value;
  }

  if (value.startsWith('#')) {
    return value as `#${string}`;
  }

  return null;
}

function updateTelegramChrome(theme: TelegramThemeParams) {
  const webApp = getWebApp();
  if (!webApp) {
    return;
  }

  if (typeof webApp.setHeaderColor === 'function') {
    const headerColor = resolveTelegramColorToken(theme.header_color);
    if (headerColor) {
      webApp.setHeaderColor(headerColor);
    }
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

function emitSafeArea(insets: SafeAreaSnapshot) {
  safeAreaListeners.forEach(listener => {
    try {
      listener(insets);
    } catch (error) {
      console.warn('Safe area listener threw an error', error);
    }
  });
}

function emitViewport(metrics: ViewportMetrics) {
  viewportListeners.forEach(listener => {
    try {
      listener(metrics);
    } catch (error) {
      console.warn('Viewport listener threw an error', error);
    }
  });
}

function emitFullscreen(isFullscreen: boolean) {
  fullscreenListeners.forEach(listener => {
    try {
      listener(isFullscreen);
    } catch (error) {
      console.warn('Fullscreen listener threw an error', error);
    }
  });
}

function updateViewportMetrics(partial: Partial<ViewportMetrics>) {
  currentViewport = {
    ...currentViewport,
    ...partial,
  };
  emitViewport(currentViewport);
}

function applyMainButtonConfig(
  button: TelegramMainButton,
  config: { text: string; color?: string; textColor?: string; disabled?: boolean }
) {
  button.setText(config.text);
  const params: { color?: string; text_color?: string } = {};

  if (config.color) {
    if (typeof button.setColor === 'function') {
      button.setColor(config.color);
    } else {
      params.color = config.color;
    }
  }
  if (config.textColor) {
    if (typeof button.setTextColor === 'function') {
      button.setTextColor(config.textColor);
    } else {
      params.text_color = config.textColor;
    }
  }
  if (typeof button.setParams === 'function' && (params.color || params.text_color)) {
    button.setParams(params as Parameters<typeof button.setParams>[0]);
  }

  if (config.disabled) {
    button.disable();
  } else {
    button.enable();
  }
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

function applyFullscreenState(
  isFullscreen: boolean | undefined,
  options: { force?: boolean } = {}
) {
  const normalized = Boolean(isFullscreen);
  if (!options.force && currentFullscreen === normalized) {
    return;
  }

  currentFullscreen = normalized;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--tg-fullscreen', normalized ? '1' : '0');
    root.dataset.tgFullscreen = normalized ? 'true' : 'false';
  }

  emitFullscreen(normalized);
}

function applySafeArea(options: { safe?: TelegramSafeArea; content?: TelegramSafeArea }) {
  const safe = options.safe ?? ZERO_SAFE_AREA;
  const content = options.content ?? safe;

  if (typeof document === 'undefined') {
    currentSafeArea = { safe, content };
    emitSafeArea(currentSafeArea);
    return;
  }

  const root = document.documentElement;
  root.style.setProperty('--tg-safe-area-inset-top', `${safe.top}px`);
  root.style.setProperty('--tg-safe-area-inset-right', `${safe.right}px`);
  root.style.setProperty('--tg-safe-area-inset-bottom', `${safe.bottom}px`);
  root.style.setProperty('--tg-safe-area-inset-left', `${safe.left}px`);
  root.style.setProperty('--tg-safe-area-top', `${safe.top}px`);
  root.style.setProperty('--tg-safe-area-right', `${safe.right}px`);
  root.style.setProperty('--tg-safe-area-bottom', `${safe.bottom}px`);
  root.style.setProperty('--tg-safe-area-left', `${safe.left}px`);

  root.style.setProperty('--tg-content-safe-area-inset-top', `${content.top}px`);
  root.style.setProperty('--tg-content-safe-area-inset-right', `${content.right}px`);
  root.style.setProperty('--tg-content-safe-area-inset-bottom', `${content.bottom}px`);
  root.style.setProperty('--tg-content-safe-area-inset-left', `${content.left}px`);
  root.style.setProperty('--tg-content-safe-area-top', `${content.top}px`);
  root.style.setProperty('--tg-content-safe-area-right', `${content.right}px`);
  root.style.setProperty('--tg-content-safe-area-bottom', `${content.bottom}px`);
  root.style.setProperty('--tg-content-safe-area-left', `${content.left}px`);

  currentSafeArea = { safe, content };
  emitSafeArea(currentSafeArea);
}

function applyViewportVars(webApp: TelegramWebApp | null, event?: TelegramViewportEvent) {
  if (!webApp) {
    return;
  }

  const height = typeof event?.height === 'number' ? event.height : webApp.viewportHeight;
  const stableHeight = webApp.viewportStableHeight;
  const width =
    typeof event?.width === 'number'
      ? event.width
      : typeof window !== 'undefined'
        ? window.innerWidth
        : currentViewport.width;
  const isExpanded =
    typeof event?.isExpanded === 'boolean'
      ? event.isExpanded
      : typeof webApp.isExpanded === 'boolean'
        ? webApp.isExpanded
        : currentViewport.isExpanded;
  const isStateStable =
    typeof event?.isStateStable === 'boolean' ? event.isStateStable : currentViewport.isStateStable;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (typeof height === 'number') {
      root.style.setProperty('--tg-viewport-height', `${height}px`);
    }
    if (typeof stableHeight === 'number') {
      root.style.setProperty('--tg-viewport-stable-height', `${stableHeight}px`);
    }
  }

  updateViewportMetrics({
    height: typeof height === 'number' ? height : currentViewport.height,
    stableHeight: typeof stableHeight === 'number' ? stableHeight : currentViewport.stableHeight,
    width: typeof width === 'number' ? width : currentViewport.width,
    isExpanded,
    isStateStable,
  });
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
    applySafeArea({});
    updateViewportMetrics({
      height: typeof window !== 'undefined' ? window.innerHeight : currentViewport.height,
      stableHeight:
        typeof window !== 'undefined' ? window.innerHeight : currentViewport.stableHeight,
      width: typeof window !== 'undefined' ? window.innerWidth : currentViewport.width,
    });
    applyFullscreenState(false, { force: true });
    initialized = true;
    return;
  }

  cachedWebApp = webApp;

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
    applyFullscreenState(webApp.isFullscreen, { force: true });

    const handleThemeChange = () => applyThemeFromParams(webApp.themeParams);
    const handleViewportChange = (event: { isStateStable: boolean }) => {
      if (!webApp.isExpanded) {
        webApp.expand();
      }
      applyViewportVars(webApp, { isStateStable: event.isStateStable });
    };
    const handleSafeAreaChange = () => {
      applySafeArea({
        safe: webApp.safeAreaInset,
        content: webApp.contentSafeAreaInset,
      });
    };
    const handleActivated = () => {
      try {
        webApp.expand();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.debug('expand() unsupported on activation', error);
        }
      }
      applyFullscreenState(webApp.isFullscreen);
    };
    const handleDeactivated = () => {
      applyFullscreenState(webApp.isFullscreen);
    };
    const handleFullscreenChange = () => {
      applyFullscreenState(webApp.isFullscreen);
    };
    const handleFullscreenFailed = (payload: { error: string }) => {
      if (import.meta.env.DEV) {
        console.debug('Fullscreen request failed', payload.error);
      }
    };

    webApp.onEvent('themeChanged', handleThemeChange);
    webApp.onEvent('viewportChanged', handleViewportChange);
    webApp.onEvent('safeAreaChanged', handleSafeAreaChange);
    webApp.onEvent('contentSafeAreaChanged', handleSafeAreaChange);
    webApp.onEvent('fullscreenChanged', handleFullscreenChange);
    webApp.onEvent('fullscreenFailed', handleFullscreenFailed);
    webApp.onEvent('activated', handleActivated);
    webApp.onEvent('deactivated', handleDeactivated);

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

export function onTelegramSafeAreaChange(listener: SafeAreaListener): () => void {
  safeAreaListeners.add(listener);
  listener(currentSafeArea);

  return () => {
    safeAreaListeners.delete(listener);
  };
}

export function getCurrentSafeArea(): SafeAreaSnapshot {
  return currentSafeArea;
}

export function onTelegramViewportChange(listener: ViewportListener): () => void {
  viewportListeners.add(listener);
  listener(currentViewport);

  return () => {
    viewportListeners.delete(listener);
  };
}

export function getViewportMetrics(): ViewportMetrics {
  return currentViewport;
}

export function onTelegramFullscreenChange(listener: (isFullscreen: boolean) => void): () => void {
  fullscreenListeners.add(listener);
  listener(currentFullscreen);

  return () => {
    fullscreenListeners.delete(listener);
  };
}

export function isTelegramFullscreen(): boolean {
  return currentFullscreen;
}

export function requestTelegramFullscreen(): boolean {
  const webApp = getWebApp();
  if (!webApp || typeof webApp.requestFullscreen !== 'function') {
    return false;
  }

  try {
    webApp.requestFullscreen();
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('requestFullscreen failed', error);
    }
    return false;
  }
}

export function exitTelegramFullscreen(): boolean {
  const webApp = getWebApp();
  if (!webApp || typeof webApp.exitFullscreen !== 'function') {
    return false;
  }

  try {
    webApp.exitFullscreen();
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('exitFullscreen failed', error);
    }
    return false;
  }
}

type TelegramMainButtonOptions = {
  text: string;
  onClick: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  showProgress?: boolean;
  keepVisibleOnUnmount?: boolean;
};

export function withTelegramMainButton(options: TelegramMainButtonOptions): () => void {
  const button = getMainButton();
  if (!button) {
    return () => undefined;
  }

  applyMainButtonConfig(button, options);

  const handler = () => {
    if (options.showProgress) {
      button.showProgress();
    }
    try {
      options.onClick();
    } finally {
      if (options.showProgress) {
        button.hideProgress();
      }
    }
  };

  button.onClick(handler);
  mainButtonHandlers.add(handler);
  if (!button.isVisible) {
    button.show();
  }

  return () => {
    button.offClick(handler);
    mainButtonHandlers.delete(handler);
    if (!options.keepVisibleOnUnmount && mainButtonHandlers.size === 0) {
      button.hideProgress();
      button.hide();
    }
  };
}

export function hideTelegramMainButton() {
  const button = getMainButton();
  if (!button) {
    return;
  }

  button.hideProgress();
  button.hide();
  mainButtonHandlers.clear();
}

function getCloudStorage(): TelegramCloudStorage | null {
  const storage = getWebApp()?.CloudStorage;
  if (!storage) {
    return null;
  }

  const promisifyVoid = (
    executor: (callback: (error: string | null) => void) => void
  ): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      executor(error => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve();
      });
    });

  const promisifyResult = <Result>(
    executor: (callback: (error: string | null, result?: Result) => void) => void,
    fallback: Result
  ): Promise<Result> =>
    new Promise<Result>((resolve, reject) => {
      executor((error, result) => {
        if (error) {
          reject(new Error(error));
          return;
        }
        resolve((result ?? fallback) as Result);
      });
    });

  return {
    async setItem(key: string, value: string) {
      await promisifyVoid(callback =>
        storage.setItem(key, value, (error: string | null) => callback(error))
      );
    },
    async getItem(key: string) {
      return promisifyResult<string | null>(
        callback =>
          storage.getItem(key, (error: string | null, result?: string) =>
            callback(error, result ?? null)
          ),
        null
      );
    },
    async removeItem(key: string) {
      await promisifyVoid(callback =>
        storage.removeItem(key, (error: string | null) => callback(error))
      );
    },
    getKeys: storage.getKeys
      ? async () =>
          promisifyResult<string[]>(
            callback =>
              storage.getKeys?.((error: string | null, result?: string[]) =>
                callback(error, result ?? [])
              ),
            []
          )
      : undefined,
    getItems: storage.getItems
      ? async (keys: string[]) =>
          promisifyResult<Record<string, string>>(
            callback =>
              storage.getItems?.(keys, (error: string | null, result?: Record<string, string>) =>
                callback(error, result ?? {})
              ),
            {}
          )
      : undefined,
  };
}

export function isCloudStorageAvailable(): boolean {
  return Boolean(getCloudStorage());
}

export async function cloudStorageSetItem(key: string, value: string): Promise<void> {
  const storage = getCloudStorage();
  if (!storage) {
    return;
  }
  await storage.setItem(key, value);
}

export async function cloudStorageGetItem(key: string): Promise<string | null> {
  const storage = getCloudStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(key);
}

export async function cloudStorageRemoveItem(key: string): Promise<void> {
  const storage = getCloudStorage();
  if (!storage) {
    return;
  }
  await storage.removeItem(key);
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
