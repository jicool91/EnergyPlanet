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
  | 'safe_area_changed'
  | 'safeAreaChanged'
  | 'contentSafeAreaChanged'
  | 'content_safe_area_changed'
  | 'activated'
  | 'deactivated'
  | 'fullscreenChanged'
  | 'fullscreenFailed';

type TelegramHapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type TelegramHapticNotification = 'error' | 'success' | 'warning';

interface TelegramBackButton {
  show: () => void;
  hide: () => void;
  isVisible: boolean;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
}

interface TelegramMainButton {
  isVisible: boolean;
  text?: string;
  setText: (text: string) => void;
  show: () => void;
  hide: () => void;
  onClick: (cb: () => void) => void;
  offClick: (cb: () => void) => void;
  showProgress: (leaveActive?: boolean) => void;
  hideProgress: () => void;
  enable: () => void;
  disable: () => void;
  setColor?: (color: string) => void;
  setTextColor?: (color: string) => void;
}

interface TelegramCloudStorage {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  getKeys?: () => Promise<string[]>;
  getItems?: (keys: string[]) => Promise<Record<string, string>>;
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
  MainButton?: TelegramMainButton;
  CloudStorage?: TelegramCloudStorage;
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
let currentTheme: TelegramThemeParams = { ...DEFAULT_THEME };
let currentSafeArea: SafeAreaSnapshot = { safe: ZERO_SAFE_AREA, content: ZERO_SAFE_AREA };
let currentViewport: ViewportMetrics = {
  height: typeof window !== 'undefined' ? window.innerHeight : null,
  stableHeight: typeof window !== 'undefined' ? window.innerHeight : null,
  width: typeof window !== 'undefined' ? window.innerWidth : null,
  isExpanded: true,
  isStateStable: true,
};

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.Telegram?.WebApp ?? null;
}

function getMainButton(): TelegramMainButton | null {
  return getWebApp()?.MainButton ?? null;
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
  if (config.color && typeof button.setColor === 'function') {
    button.setColor(config.color);
  }
  if (config.textColor && typeof button.setTextColor === 'function') {
    button.setTextColor(config.textColor);
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

function applySafeArea(options: { safe?: TelegramSafeArea; content?: TelegramSafeArea }) {
  const root = document.documentElement;
  const safe = options.safe ?? ZERO_SAFE_AREA;
  const content = options.content ?? safe;

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
  const root = document.documentElement;
  if (!webApp) {
    return;
  }

  const height = typeof event?.height === 'number' ? event.height : webApp.viewportHeight;
  const stableHeight = webApp.viewportStableHeight;
  const width = typeof event?.width === 'number' ? event.width : currentViewport.width;
  const isExpanded =
    typeof event?.isExpanded === 'boolean'
      ? event.isExpanded
      : typeof webApp.isExpanded === 'boolean'
        ? webApp.isExpanded
        : currentViewport.isExpanded;
  const isStateStable =
    typeof event?.isStateStable === 'boolean' ? event.isStateStable : currentViewport.isStateStable;

  if (typeof height === 'number') {
    root.style.setProperty('--tg-viewport-height', `${height}px`);
  }

  if (typeof stableHeight === 'number') {
    root.style.setProperty('--tg-viewport-stable-height', `${stableHeight}px`);
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
      applyViewportVars(webApp, event);
    };
    const handleSafeAreaChange = () => {
      applySafeArea({
        safe: webApp.safeAreaInset,
        content: webApp.contentSafeAreaInset,
      });
    };
    const handleContentSafeAreaChange = () => {
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
    };

    webApp.onEvent('themeChanged', handleThemeChange);
    webApp.onEvent('viewportChanged', handleViewportChange);
    webApp.onEvent('safeAreaChanged', handleSafeAreaChange);
    webApp.onEvent('safe_area_changed', handleSafeAreaChange);
    webApp.onEvent('contentSafeAreaChanged', handleContentSafeAreaChange);
    webApp.onEvent('content_safe_area_changed', handleContentSafeAreaChange);
    webApp.onEvent('activated', handleActivated);

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
  return getWebApp()?.CloudStorage ?? null;
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
