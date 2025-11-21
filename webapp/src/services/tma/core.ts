import { init, isTMA, miniApp, swipeBehavior, themeParams, viewport } from '@tma.js/sdk';

type TmaSetupState =
  | { status: 'idle'; available: false }
  | { status: 'pending'; available: false }
  | { status: 'ready'; available: true }
  | { status: 'failed'; available: false; error: unknown };

let state: TmaSetupState = { status: 'idle', available: false };
let cleanup: VoidFunction | null = null;

function setup(): void {
  // Allow retry when previous probe failed. Skip only while another setup is in-flight.
  if (state.status === 'pending') {
    return;
  }

  state = { status: 'pending', available: false };

  if (typeof window === 'undefined') {
    state = { status: 'failed', available: false, error: new Error('Window is undefined') };
    return;
  }

  const isTelegramEnv = (() => {
    try {
      return isTMA();
    } catch {
      return Boolean(window.Telegram?.WebApp);
    }
  })();

  if (!isTelegramEnv) {
    state = {
      status: 'failed',
      available: false,
      error: new Error('Telegram Mini App environment is not detected'),
    };
    return;
  }

  try {
    cleanup = init();

    // Mount core features that should stay in sync with Telegram runtime.
    themeParams.mount();
    miniApp.mount();
    viewport.mount();
    if (!swipeBehavior.isMounted()) {
      swipeBehavior.mount();
    }

    try {
      miniApp.ready();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('miniApp.ready() failed', error);
      }
    }

    try {
      void viewport.expand();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('viewport.expand() failed', error);
      }
    }

    try {
      swipeBehavior.disableVertical();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.debug('swipeBehavior.disableVertical() failed', error);
      }
    }

    state = { status: 'ready', available: true };
  } catch (error) {
    state = { status: 'failed', available: false, error };
  }
}

export function ensureTmaSdkReady(): void {
  setup();
}

export function isTmaSdkAvailable(): boolean {
  setup();
  return state.available;
}

export function getTmaSdkError(): unknown | null {
  setup();
  return state.status === 'failed' ? (state.error ?? null) : null;
}

export function disposeTmaSdk(): void {
  if (cleanup) {
    try {
      cleanup();
    } catch {
      // Suppress cleanup failures, we only use this for tests or dev reloads.
    }
    cleanup = null;
  }
  if (themeParams.isMounted()) {
    themeParams.unmount();
  }
  if (miniApp.isMounted()) {
    miniApp.unmount();
  }
  if (swipeBehavior.isMounted()) {
    swipeBehavior.unmount();
  }
  state = { status: 'idle', available: false };
}
