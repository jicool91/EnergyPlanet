/**
 * Telegram WebApp integration helpers.
 * Encapsulates initialization, theme management, haptics and back button helpers.
 */

type ThemeColorKey =
  | 'bg_color'
  | 'text_color'
  | 'hint_color'
  | 'link_color'
  | 'button_color'
  | 'button_text_color'
  | 'secondary_bg_color';

export type TelegramThemeParams = Partial<Record<ThemeColorKey, string>> & {
  header_color?: string;
  bottom_bar_color?: string;
};

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
    handler:
      EventName extends 'viewportChanged'
        ? (event: TelegramViewportEvent) => void
        : EventName extends 'safe_area_changed'
          ? (inset: TelegramSafeArea) => void
          : () => void
  ): void;
  offEvent<EventName extends TelegramWebAppEvents>(
    eventType: EventName,
    handler:
      EventName extends 'viewportChanged'
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

const THEME_VARIABLE_MAP: Record<ThemeColorKey, string> = {
  bg_color: '--tg-theme-bg-color',
  text_color: '--tg-theme-text-color',
  hint_color: '--tg-theme-hint-color',
  link_color: '--tg-theme-link-color',
  button_color: '--tg-theme-button-color',
  button_text_color: '--tg-theme-button-text-color',
  secondary_bg_color: '--tg-theme-secondary-bg-color',
};

export const DEFAULT_THEME: TelegramThemeParams = {
  bg_color: '#0f0f0f',
  text_color: '#ffffff',
  hint_color: '#a0a0a0',
  link_color: '#64b5f6',
  button_color: '#1f6feb',
  button_text_color: '#ffffff',
  secondary_bg_color: '#181818',
};

let initialized = false;
const themeListeners = new Set<ThemeListener>();

function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.Telegram?.WebApp ?? null;
}

function applyTheme(theme: TelegramThemeParams | undefined) {
  const params = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const root = document.documentElement;

  (Object.entries(THEME_VARIABLE_MAP) as Array<[ThemeColorKey, string]>).forEach(
    ([paramKey, cssVar]) => {
      const value = params[paramKey];
      if (value) {
        root.style.setProperty(cssVar, value);
        if (paramKey === 'bg_color') {
          document.body.style.backgroundColor = value;
        }
        if (paramKey === 'text_color') {
          document.body.style.color = value;
        }
      }
    }
  );

  if (params.header_color && typeof getWebApp()?.setHeaderColor === 'function') {
    getWebApp()?.setHeaderColor?.(params.header_color);
  }
  if (params.bottom_bar_color && typeof getWebApp()?.setBottomBarColor === 'function') {
    getWebApp()?.setBottomBarColor?.(params.bottom_bar_color);
  }

  const colorScheme = getWebApp()?.colorScheme ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  root.dataset.colorScheme = colorScheme;

  // Update theme-color meta for mobile status bar
  const themeMeta =
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ??
    (() => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
      return meta;
    })();

  themeMeta.content = params.bg_color ?? DEFAULT_THEME.bg_color!;

  themeListeners.forEach(listener => {
    try {
      listener(params);
    } catch (error) {
      console.warn('Theme listener threw an error', error);
    }
  });
}

function applySafeArea(options: {
  safe?: TelegramSafeArea;
  content?: TelegramSafeArea;
}) {
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
    applyTheme(DEFAULT_THEME);
    initialized = true;
    return;
  }

  try {
    webApp.ready();
    webApp.expand();
    webApp.disableVerticalSwipes();
    applyTheme(webApp.themeParams);
    applySafeArea({
      safe: webApp.safeAreaInset,
      content: webApp.contentSafeAreaInset,
    });
    applyViewportVars(webApp);

    const handleThemeChange = () => applyTheme(webApp.themeParams);
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
    applyTheme(DEFAULT_THEME);
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
  const webApp = getWebApp();
  if (webApp) {
    listener({ ...DEFAULT_THEME, ...webApp.themeParams });
  } else {
    listener(DEFAULT_THEME);
  }

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
