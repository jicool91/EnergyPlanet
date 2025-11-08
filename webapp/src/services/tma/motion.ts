import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';

export type GyroscopeVector = {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
};

export interface GyroscopeOptions {
  refreshRate?: number;
}

type GyroscopeListener = (vector: GyroscopeVector) => void;

const listeners = new Set<GyroscopeListener>();
let isActive = false;
let webAppHandler: ((payload?: unknown) => void) | null = null;

interface TelegramWebAppLite {
  onEvent?: (event: string, handler: (payload?: unknown) => void) => void;
  offEvent?: (event: string, handler: (payload?: unknown) => void) => void;
  postEvent?: (event: string, payload?: string) => void;
  isVersionAtLeast?: (version: string) => boolean;
}

function getTelegramWebApp(): TelegramWebAppLite | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return window.Telegram?.WebApp as TelegramWebAppLite | undefined;
}

function parsePayload(payload: unknown): GyroscopeVector | null {
  if (payload == null) {
    return null;
  }

  if (typeof payload === 'string') {
    try {
      return parsePayload(JSON.parse(payload));
    } catch {
      return null;
    }
  }

  if (typeof payload !== 'object') {
    return null;
  }

  const maybeVector = payload as Record<string, unknown>;
  const x = typeof maybeVector.x === 'number' ? maybeVector.x : Number(maybeVector.alpha);
  const y = typeof maybeVector.y === 'number' ? maybeVector.y : Number(maybeVector.beta);
  const z = typeof maybeVector.z === 'number' ? maybeVector.z : Number(maybeVector.gamma);
  const timestamp = typeof maybeVector.timestamp === 'number' ? maybeVector.timestamp : undefined;

  if ([x, y, z].some(value => Number.isNaN(value))) {
    return null;
  }

  return {
    x,
    y,
    z,
    timestamp,
  };
}

function dispatch(vector: GyroscopeVector): void {
  listeners.forEach(listener => listener(vector));
}

function ensureHandler(): void {
  if (webAppHandler) {
    return;
  }

  const webApp = getTelegramWebApp();
  if (!webApp?.onEvent) {
    return;
  }

  webAppHandler = payload => {
    const vector = parsePayload(payload);
    if (vector) {
      dispatch(vector);
    }
  };

  webApp.onEvent('gyroscopeChanged', webAppHandler);
}

function removeHandler(): void {
  if (!webAppHandler) {
    return;
  }

  const webApp = getTelegramWebApp();
  try {
    webApp?.offEvent?.('gyroscopeChanged', webAppHandler);
  } catch {
    // ignore
  }
  webAppHandler = null;
}

function toggleGyroscope(active: boolean, options?: GyroscopeOptions): void {
  const webApp = getTelegramWebApp();
  if (!webApp?.postEvent) {
    return;
  }

  const refreshRate = Math.max(5, Math.min(200, options?.refreshRate ?? 50));

  const payload = active ? { refresh_rate: refreshRate } : undefined;
  const method = active ? 'web_app_start_gyroscope' : 'web_app_stop_gyroscope';

  try {
    webApp.postEvent(method, payload ? JSON.stringify(payload) : undefined);
  } catch {
    // ignore errors from the host app
  }
}

export function isGyroscopeSupported(): boolean {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    const runtime = getTmaRuntimeSnapshot();
    if (runtime?.miniApp && typeof runtime.miniApp.isVersionAtLeast === 'function') {
      return runtime.miniApp.isVersionAtLeast('8.0');
    }
    return false;
  }

  if (typeof webApp.isVersionAtLeast === 'function') {
    return webApp.isVersionAtLeast('8.0');
  }

  // Fall back to SDK availability if version detection is not exposed.
  ensureTmaSdkReady();
  return isTmaSdkAvailable();
}

export function subscribeGyroscope(
  listener: GyroscopeListener,
  options?: GyroscopeOptions
): VoidFunction {
  listeners.add(listener);

  if (!isActive && listeners.size > 0) {
    ensureTmaSdkReady();
    if (isGyroscopeSupported()) {
      ensureHandler();
      toggleGyroscope(true, options);
      isActive = true;
    }
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && isActive) {
      toggleGyroscope(false);
      removeHandler();
      isActive = false;
    }
  };
}

export function stopGyroscope(): void {
  if (!isActive) {
    return;
  }

  toggleGyroscope(false);
  removeHandler();
  listeners.clear();
  isActive = false;
}
