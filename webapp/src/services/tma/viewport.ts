import { viewport } from '@tma.js/sdk';
import type { SafeAreaInsets } from '@tma.js/bridge';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { HEADER_BUFFER_PX, HEADER_RESERVE_PX, SAFE_AREA_CSS_VARIABLES } from '@/constants/layout';
import { logger } from '@/utils/logger';
import { logClientEvent } from '@/services/telemetry';

export type SafeAreaSnapshot = {
  safe: SafeAreaInsets;
  content: SafeAreaInsets;
};

export type ViewportMetrics = {
  height: number | null;
  stableHeight: number | null;
  width: number | null;
  isExpanded: boolean;
  isStateStable: boolean;
  isFullscreen: boolean;
};

type Listener<T> = (value: T) => void;

type ViewportAction = 'expand' | 'requestFullscreen' | 'exitFullscreen';

type SafeAreaOverrideConfig = {
  safe?: Partial<SafeAreaInsets>;
  content?: Partial<SafeAreaInsets>;
};

type ViewportOverrideConfig = Partial<ViewportMetrics>;

type TelemetryOrigin = 'sdk' | 'override';

const ZERO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

const DEFAULT_VIEWPORT_METRICS: ViewportMetrics = {
  height: typeof window !== 'undefined' ? window.innerHeight : null,
  stableHeight: typeof window !== 'undefined' ? window.innerHeight : null,
  width: typeof window !== 'undefined' ? window.innerWidth : null,
  isExpanded: true,
  isStateStable: true,
  isFullscreen: false,
};

let currentSafeArea: SafeAreaSnapshot = { safe: ZERO_INSETS, content: ZERO_INSETS };
let currentViewport: ViewportMetrics = { ...DEFAULT_VIEWPORT_METRICS };

const SAFE_AREA_TELEMETRY_COOLDOWN_MS = 2_000;
const VIEWPORT_TELEMETRY_COOLDOWN_MS = 2_000;

let lastSafeAreaTelemetry: SafeAreaSnapshot | null = null;
let lastViewportTelemetry: ViewportMetrics | null = null;
let lastSafeAreaTelemetryAt = 0;
let lastViewportTelemetryAt = 0;

const SAFE_AREA_KEYS: Array<keyof SafeAreaInsets> = ['top', 'right', 'bottom', 'left'];

function sanitizeInsetValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function sanitizeInsets(input?: Partial<SafeAreaInsets>): SafeAreaInsets {
  if (!input) {
    return { ...ZERO_INSETS };
  }
  return SAFE_AREA_KEYS.reduce<SafeAreaInsets>(
    (result, key) => {
      result[key] = sanitizeInsetValue(input[key]);
      return result;
    },
    { ...ZERO_INSETS }
  );
}

function readSafeAreaOverride(): SafeAreaSnapshot | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const override = window.__safeAreaOverride as SafeAreaOverrideConfig | undefined;
  if (!override) {
    return null;
  }

  const safe = sanitizeInsets(override.safe);
  const content = override.content ? sanitizeInsets(override.content) : safe;
  return { safe, content };
}

function readViewportOverride(): ViewportMetrics | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const override = window.__viewportMetricsOverride as ViewportOverrideConfig | undefined;
  if (!override) {
    return null;
  }

  return {
    height: typeof override.height === 'number' ? override.height : null,
    stableHeight: typeof override.stableHeight === 'number' ? override.stableHeight : null,
    width: typeof override.width === 'number' ? override.width : null,
    isExpanded: override.isExpanded ?? DEFAULT_VIEWPORT_METRICS.isExpanded,
    isStateStable: override.isStateStable ?? DEFAULT_VIEWPORT_METRICS.isStateStable,
    isFullscreen: override.isFullscreen ?? DEFAULT_VIEWPORT_METRICS.isFullscreen,
  };
}

interface TelegramWebAppLite {
  onEvent?: (event: string, handler: (payload?: unknown) => void) => void;
  offEvent?: (event: string, handler: (payload?: unknown) => void) => void;
  postEvent?: (event: string, payload?: string) => void;
  expand?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
}

function getTelegramWebApp(): TelegramWebAppLite | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.Telegram?.WebApp as TelegramWebAppLite | undefined;
}

function normalizeErrorPayload(error: unknown): Record<string, unknown> | undefined {
  if (!error) {
    return undefined;
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined,
    };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { error };
}

function logViewportAction(
  action: ViewportAction,
  status: 'success' | 'failed' | 'unsupported',
  extra?: Record<string, unknown>
) {
  const context = {
    safeArea: currentSafeArea,
    viewport: currentViewport,
    action,
    status,
    ...extra,
  };

  const message = `[viewport] ${action} -> ${status}`;
  if (status === 'failed') {
    logger.warn(message, context);
  } else {
    logger.info(message, context);
  }

  const severity = status === 'failed' ? 'warn' : 'info';
  void logClientEvent('viewport_action', context, severity);
  if (status === 'failed' && (action === 'requestFullscreen' || action === 'exitFullscreen')) {
    void logClientEvent('fullscreen_error', context, 'error');
  }
}

function applySafeAreaCss(snapshot: SafeAreaSnapshot): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const { safe, content } = snapshot;

  // CSS variable matrix mirrors Section 6 of `docs/telegram-fullscreen-status-bar.md`.
  // `--tg-safe-area-*` map to hardware insets, `--tg-content-safe-area-*` capture Telegram chrome.
  // Derived `--app-*` tokens feed React layouts via CSS so we never re-compute padding manually.

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
  root.dataset.tgSafeAreaTop = `${safe.top}`;
  root.dataset.tgSafeAreaRight = `${safe.right}`;
  root.dataset.tgSafeAreaBottom = `${safe.bottom}`;
  root.dataset.tgSafeAreaLeft = `${safe.left}`;
  root.dataset.tgContentSafeAreaTop = `${content.top}`;
  root.dataset.tgContentSafeAreaRight = `${content.right}`;
  root.dataset.tgContentSafeAreaBottom = `${content.bottom}`;
  root.dataset.tgContentSafeAreaLeft = `${content.left}`;

  const deviceInsetTop = Math.max(0, safe.top);
  const telegramInsetTop = Math.max(0, content.top);
  const headerBaseInset = deviceInsetTop + telegramInsetTop;
  const contentBaseInset = headerBaseInset;
  const headerOffset = headerBaseInset + HEADER_BUFFER_PX;
  const contentPaddingTop = contentBaseInset + HEADER_RESERVE_PX + HEADER_BUFFER_PX;

  root.style.setProperty(SAFE_AREA_CSS_VARIABLES.headerReserve, `${HEADER_RESERVE_PX}px`);
  root.style.setProperty(SAFE_AREA_CSS_VARIABLES.headerBuffer, `${HEADER_BUFFER_PX}px`);
  root.style.setProperty(SAFE_AREA_CSS_VARIABLES.contentBaseTop, `${contentBaseInset}px`);
  root.style.setProperty(SAFE_AREA_CSS_VARIABLES.headerOffsetTop, `${headerOffset}px`);
  root.style.setProperty(SAFE_AREA_CSS_VARIABLES.contentPaddingTop, `${contentPaddingTop}px`);
}

function resolveViewportDimension(value: number | null | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  return fallback;
}

function applyViewportCss(metrics: ViewportMetrics): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const fallbackHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const fallbackWidth = typeof window !== 'undefined' ? window.innerWidth : 480;
  const resolvedHeight = resolveViewportDimension(metrics.height, fallbackHeight);
  const resolvedStableHeight = resolveViewportDimension(metrics.stableHeight, resolvedHeight);
  const resolvedWidth = resolveViewportDimension(metrics.width, fallbackWidth);

  const heightValue = `${resolvedHeight}px`;
  root.style.setProperty('--tg-viewport-height', heightValue);
  root.style.setProperty('--layout-viewport-height', heightValue);

  const stableValue = `${resolvedStableHeight}px`;
  root.style.setProperty('--tg-viewport-stable-height', stableValue);
  root.style.setProperty('--layout-viewport-stable-height', stableValue);

  const widthValue = `${resolvedWidth}px`;
  root.style.setProperty('--tg-viewport-width', widthValue);
  root.style.setProperty('--layout-viewport-width', widthValue);

  root.style.setProperty('--tg-viewport-is-expanded', metrics.isExpanded ? '1' : '0');
  root.style.setProperty('--tg-viewport-is-stable', metrics.isStateStable ? '1' : '0');
  root.style.setProperty('--tg-viewport-is-fullscreen', metrics.isFullscreen ? '1' : '0');
  root.style.setProperty('--tg-fullscreen', metrics.isFullscreen ? '1' : '0');
  root.dataset.tgViewportExpanded = metrics.isExpanded ? 'true' : 'false';
  root.dataset.tgViewportStable = metrics.isStateStable ? 'true' : 'false';
  root.dataset.tgViewportFullscreen = metrics.isFullscreen ? 'true' : 'false';
}

function areInsetsEqual(a: SafeAreaInsets, b: SafeAreaInsets): boolean {
  return SAFE_AREA_KEYS.every(key => a[key] === b[key]);
}

function areSafeAreaSnapshotsEqual(
  a: SafeAreaSnapshot | null,
  b: SafeAreaSnapshot | null
): boolean {
  if (!a || !b) {
    return false;
  }
  return areInsetsEqual(a.safe, b.safe) && areInsetsEqual(a.content, b.content);
}

function areViewportMetricsEqual(a: ViewportMetrics | null, b: ViewportMetrics | null): boolean {
  if (!a || !b) {
    return false;
  }
  return (
    a.height === b.height &&
    a.stableHeight === b.stableHeight &&
    a.width === b.width &&
    a.isExpanded === b.isExpanded &&
    a.isStateStable === b.isStateStable &&
    a.isFullscreen === b.isFullscreen
  );
}

function maybeLogSafeAreaTelemetry(origin: TelemetryOrigin, snapshot: SafeAreaSnapshot): void {
  const now = Date.now();
  const shouldLog =
    !areSafeAreaSnapshotsEqual(snapshot, lastSafeAreaTelemetry) ||
    now - lastSafeAreaTelemetryAt > SAFE_AREA_TELEMETRY_COOLDOWN_MS;

  if (!shouldLog) {
    return;
  }

  lastSafeAreaTelemetry = snapshot;
  lastSafeAreaTelemetryAt = now;

  void logClientEvent('safe_area_changed', {
    origin,
    safe: snapshot.safe,
    content: snapshot.content,
    viewport: {
      isFullscreen: currentViewport.isFullscreen,
      isExpanded: currentViewport.isExpanded,
      height: currentViewport.height,
      stableHeight: currentViewport.stableHeight,
    },
  });
}

function maybeLogViewportTelemetry(origin: TelemetryOrigin, metrics: ViewportMetrics): void {
  const now = Date.now();
  const shouldLog =
    !areViewportMetricsEqual(metrics, lastViewportTelemetry) ||
    now - lastViewportTelemetryAt > VIEWPORT_TELEMETRY_COOLDOWN_MS;

  if (!shouldLog) {
    return;
  }

  lastViewportTelemetry = metrics;
  lastViewportTelemetryAt = now;

  void logClientEvent('viewport_metrics_changed', {
    origin,
    metrics,
  });
}

function readSafeAreaSnapshot(): SafeAreaSnapshot {
  const safe = viewport.safeAreaInsets();
  const content = viewport.contentSafeAreaInsets();
  return {
    safe: safe ?? ZERO_INSETS,
    content: content ?? safe ?? ZERO_INSETS,
  };
}

function readViewportMetrics(): ViewportMetrics {
  const height = viewport.height();
  const stableHeight = viewport.stableHeight();
  const width = viewport.width();
  const isExpanded = viewport.isExpanded();
  const isStateStable = viewport.isStable();
  const isFullscreen = viewport.isFullscreen();
  return {
    height: Number.isFinite(height) ? height : null,
    stableHeight: Number.isFinite(stableHeight) ? stableHeight : null,
    width: Number.isFinite(width) ? width : null,
    isExpanded: Boolean(isExpanded),
    isStateStable: Boolean(isStateStable),
    isFullscreen: Boolean(isFullscreen),
  };
}

function updateSafeArea(snapshot: SafeAreaSnapshot, origin: TelemetryOrigin): SafeAreaSnapshot {
  currentSafeArea = snapshot;
  applySafeAreaCss(snapshot);
  maybeLogSafeAreaTelemetry(origin, snapshot);
  return snapshot;
}

function updateViewport(metrics: ViewportMetrics, origin: TelemetryOrigin): ViewportMetrics {
  currentViewport = metrics;
  applyViewportCss(metrics);
  maybeLogViewportTelemetry(origin, metrics);
  return metrics;
}

/**
 * Returns the latest safe-area snapshot, falling back to Telegram overrides when SDK metrics
 * are unavailable (e.g. before `miniApp.ready`).
 */
export function getTmaSafeAreaSnapshot(): SafeAreaSnapshot {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return updateSafeArea(
      readSafeAreaOverride() ?? { safe: ZERO_INSETS, content: ZERO_INSETS },
      'override'
    );
  }
  return updateSafeArea(readSafeAreaSnapshot(), 'sdk');
}

/**
 * Returns current viewport metrics (height, width, fullscreen flags) with sensible fallbacks
 * so layout code can render even before Telegram finishes bootstrapping.
 */
export function getTmaViewportMetrics(): ViewportMetrics {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return updateViewport(readViewportOverride() ?? { ...DEFAULT_VIEWPORT_METRICS }, 'override');
  }
  return updateViewport(readViewportMetrics(), 'sdk');
}

/**
 * Subscribes to safe-area updates and immediately invokes the listener with the latest snapshot.
 */
export function onTmaSafeAreaChange(listener: Listener<SafeAreaSnapshot>): VoidFunction {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    listener(
      updateSafeArea(
        readSafeAreaOverride() ?? { safe: ZERO_INSETS, content: ZERO_INSETS },
        'override'
      )
    );
    return () => {};
  }

  const notify = (origin: TelemetryOrigin = 'sdk') =>
    listener(updateSafeArea(readSafeAreaSnapshot(), origin));
  const unsubscribe = viewport.state.sub(() => notify('sdk'));
  const webApp = getTelegramWebApp();
  let offNative: VoidFunction | null = null;

  if (webApp?.onEvent) {
    const handler = () => notify('sdk');
    webApp.onEvent('safeAreaChanged', handler);
    offNative = () => {
      try {
        webApp.offEvent?.('safeAreaChanged', handler);
      } catch {
        // ignore
      }
    };
  }

  notify('sdk');
  return () => {
    unsubscribe();
    offNative?.();
  };
}

/**
 * Subscribes to viewport metric updates (expand/fullscreen transitions, height changes).
 */
export function onTmaViewportChange(listener: Listener<ViewportMetrics>): VoidFunction {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    listener(updateViewport(readViewportOverride() ?? { ...DEFAULT_VIEWPORT_METRICS }, 'override'));
    return () => {};
  }

  const notify = (origin: TelemetryOrigin = 'sdk') =>
    listener(updateViewport(readViewportMetrics(), origin));
  const unsubscribe = viewport.state.sub(() => notify('sdk'));
  const webApp = getTelegramWebApp();
  let offNative: VoidFunction | null = null;

  if (webApp?.onEvent) {
    const handler = () => notify('sdk');
    webApp.onEvent('viewportChanged', handler);
    offNative = () => {
      try {
        webApp.offEvent?.('viewportChanged', handler);
      } catch {
        // ignore
      }
    };
  }

  notify('sdk');
  return () => {
    unsubscribe();
    offNative?.();
  };
}

/**
 * Helper subscription that only streams fullscreen state changes.
 */
export function onFullscreenChange(listener: Listener<boolean>): VoidFunction {
  return onTmaViewportChange(metrics => listener(Boolean(metrics.isFullscreen)));
}

/** Returns the last cached safe-area snapshot without touching the SDK. */
export function getCachedSafeArea(): SafeAreaSnapshot {
  return currentSafeArea;
}

/** Returns the last cached viewport metrics without touching the SDK. */
export function getCachedViewportMetrics(): ViewportMetrics {
  return currentViewport;
}

/**
 * Requests expanded layout mode. Falls back to legacy `Telegram.WebApp.expand` when needed
 * and logs telemetry for success/failure so regressions get surfaced in Grafana.
 */
export function expandViewport(): void {
  ensureTmaSdkReady();
  if (isTmaSdkAvailable()) {
    try {
      viewport.expand();
      logViewportAction('expand', 'success', { path: 'sdk' });
      return;
    } catch (error) {
      logViewportAction('expand', 'failed', {
        path: 'sdk',
        error: normalizeErrorPayload(error),
      });
    }
  }

  const webApp = getTelegramWebApp();
  try {
    if (webApp?.expand) {
      webApp.expand();
      logViewportAction('expand', 'success', { path: 'legacy' });
      return;
    }
    logViewportAction('expand', 'unsupported', { reason: 'expand_not_available' });
  } catch (error) {
    logViewportAction('expand', 'failed', {
      path: 'legacy',
      error: normalizeErrorPayload(error),
    });
  }
}

/** Checks whether requestFullscreen can be attempted on the current Telegram version. */
export function isFullscreenAvailable(): boolean {
  const webApp = getTelegramWebApp();
  if (webApp?.isVersionAtLeast) {
    return webApp.isVersionAtLeast('8.0');
  }
  return isTmaSdkAvailable();
}

/**
 * Attempts to enter fullscreen using the modern SDK API or legacy `postEvent` fallback.
 * Telemetry captures success/failure plus the code path to simplify debugging.
 */
export async function requestFullscreen(): Promise<void> {
  ensureTmaSdkReady();

  if (isTmaSdkAvailable() && typeof viewport.requestFullscreen === 'function') {
    try {
      await viewport.requestFullscreen();
      logViewportAction('requestFullscreen', 'success', { path: 'sdk' });
      return;
    } catch (error) {
      logViewportAction('requestFullscreen', 'failed', {
        path: 'sdk',
        error: normalizeErrorPayload(error),
      });
    }
  }

  const webApp = getTelegramWebApp();
  if (webApp?.postEvent) {
    try {
      webApp.postEvent('web_app_enable_fullscreen');
      logViewportAction('requestFullscreen', 'success', { path: 'legacy' });
      return;
    } catch (error) {
      logViewportAction('requestFullscreen', 'failed', {
        path: 'legacy',
        error: normalizeErrorPayload(error),
      });
    }
  }

  logViewportAction('requestFullscreen', 'unsupported', {
    reason: 'postEvent_unavailable',
  });
}

/**
 * Requests exiting fullscreen, mirroring `requestFullscreen` fallback logic and telemetry.
 */
export async function exitFullscreen(): Promise<void> {
  ensureTmaSdkReady();

  if (isTmaSdkAvailable() && typeof viewport.exitFullscreen === 'function') {
    try {
      await viewport.exitFullscreen();
      logViewportAction('exitFullscreen', 'success', { path: 'sdk' });
      return;
    } catch (error) {
      logViewportAction('exitFullscreen', 'failed', {
        path: 'sdk',
        error: normalizeErrorPayload(error),
      });
    }
  }

  const webApp = getTelegramWebApp();
  if (webApp?.postEvent) {
    try {
      webApp.postEvent('web_app_disable_fullscreen');
      logViewportAction('exitFullscreen', 'success', { path: 'legacy' });
      return;
    } catch (error) {
      logViewportAction('exitFullscreen', 'failed', {
        path: 'legacy',
        error: normalizeErrorPayload(error),
      });
    }
  }

  logViewportAction('exitFullscreen', 'unsupported', {
    reason: 'postEvent_unavailable',
  });
}
