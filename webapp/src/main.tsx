/**
 * Energy Planet Webapp - Main Entry Point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { authStore } from './store/authStore';
import { uiStore } from './store/uiStore';
import { initializeTelegramTheme } from './utils/telegramTheme';
import { logger } from './utils/logger';
import { ensureTmaSdkReady } from '@/services/tma/core';
import { getTmaThemeSnapshot, onTmaThemeChange } from '@/services/tma/theme';
import {
  getCachedSafeArea,
  getCachedViewportMetrics,
  getTmaSafeAreaSnapshot,
  getTmaViewportMetrics,
  onTmaSafeAreaChange,
  onTmaViewportChange,
  requestFullscreen,
  exitFullscreen,
} from '@/services/tma/viewport';
import type { SafeAreaSnapshot, ViewportMetrics } from '@/services/tma/viewport';
import { sessionManager } from './services/sessionManager';
import { logClientEvent } from './services/telemetry';
import { useGameStore } from './store/gameStore';
import { usePreferencesStore } from './store/preferencesStore';

// Export logger to window for debugging
declare global {
  interface Window {
    _energyLogs?: typeof logger;
    __APP_TEST_HOOKS__?: {
      openAuthError: (message?: string) => void;
      dismissAuthError: () => void;
      simulateLevelUp: (targetLevel?: number) => void;
      setReduceMotion: (enabled: boolean) => void;
      setFullscreenState: (isFullscreen: boolean) => void;
    };
  }
}

type RenderMetricsShape = {
  app: number;
  safeAreaTop?: number;
  contentSafeAreaTop?: number;
  isFullscreen?: boolean;
};

const SAFE_AREA_TELEMETRY_THRESHOLD = 4;
let lastSafeAreaTelemetry = { safeAreaTop: 0, contentSafeAreaTop: 0 };
let hasSafeAreaTelemetryBaseline = false;

function updateRenderMetrics(partial: Partial<RenderMetricsShape>) {
  if (typeof window === 'undefined') {
    return;
  }

  const metrics = window.__renderMetrics ?? { app: 0 };
  window.__renderMetrics = {
    ...metrics,
    ...partial,
  };
}

function captureSafeAreaMetrics(snapshot: SafeAreaSnapshot) {
  const safeAreaTop = Math.max(0, snapshot.safe.top ?? 0);
  const contentSafeAreaTop = Math.max(0, snapshot.content.top ?? 0);

  updateRenderMetrics({
    safeAreaTop,
    contentSafeAreaTop,
  });

  trackSafeAreaTelemetry(safeAreaTop, contentSafeAreaTop);
}

function trackSafeAreaTelemetry(safeAreaTop: number, contentSafeAreaTop: number) {
  if (!hasSafeAreaTelemetryBaseline) {
    lastSafeAreaTelemetry = { safeAreaTop, contentSafeAreaTop };
    hasSafeAreaTelemetryBaseline = true;
    return;
  }

  const safeDelta = Math.abs(safeAreaTop - lastSafeAreaTelemetry.safeAreaTop);
  const contentDelta = Math.abs(contentSafeAreaTop - lastSafeAreaTelemetry.contentSafeAreaTop);

  if (safeDelta >= SAFE_AREA_TELEMETRY_THRESHOLD || contentDelta >= SAFE_AREA_TELEMETRY_THRESHOLD) {
    void logClientEvent('ui_safe_area_delta', {
      safeAreaTop,
      contentSafeAreaTop,
      safeDelta,
      contentDelta,
      timestamp: Date.now(),
    });
  }

  lastSafeAreaTelemetry = { safeAreaTop, contentSafeAreaTop };
}

function captureViewportMetrics(metrics: ViewportMetrics) {
  const previous = typeof window !== 'undefined' ? window.__renderMetrics?.isFullscreen : undefined;
  const next = Boolean(metrics.isFullscreen);
  updateRenderMetrics({
    isFullscreen: next,
  });

  uiStore.setFullscreenState(next);

  if (typeof previous === 'boolean' && previous !== next) {
    logger.info('[viewport] Fullscreen state changed', {
      previous,
      next,
      safeArea: getCachedSafeArea(),
      viewport: metrics,
    });
  }
}

function installSafeAreaDebugCommand() {
  if (typeof window === 'undefined') {
    return;
  }

  const runDebugCommand = (command: string) => {
    if (command !== '/debug_safe_area') {
      logger.warn('[dev-command] Unknown command', { command });
      return false;
    }

    const safeArea = getCachedSafeArea();
    const viewportState = getCachedViewportMetrics();
    const renderMetrics = window.__renderMetrics;

    logger.info('[/debug_safe_area] Safe area snapshot', {
      safeArea,
      viewport: viewportState,
      renderMetrics,
    });

    if (typeof console.group === 'function') {
      console.group('/debug_safe_area');
    }
    console.log('safeArea.safe', safeArea.safe);
    console.log('safeArea.content', safeArea.content);
    console.log('viewport', viewportState);
    console.log('renderMetrics', renderMetrics);
    if (typeof console.groupEnd === 'function') {
      console.groupEnd();
    }

    return true;
  };

  window.__runDebugCommand = runDebugCommand;
  window.debug_safe_area = () => {
    runDebugCommand('/debug_safe_area');
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.metaKey && event.shiftKey && event.key.toLowerCase() === 's') {
      const handled = runDebugCommand('/debug_safe_area');
      if (handled) {
        event.preventDefault();
      }
    }
  };

  window.addEventListener('keydown', handleKeydown);

  if (import.meta.env.DEV) {
    console.info(
      'Dev command ready: run debug_safe_area() or window.__runDebugCommand("/debug_safe_area") to log safe-area metrics.'
    );
    console.info('Keyboard shortcut: Meta + Shift + S');
  }
}

window._energyLogs = logger;

initializeTelegramTheme();
try {
  ensureTmaSdkReady();
} catch (error) {
  logger.warn('Failed to initialize TMA SDK', { error });
}

uiStore.updateTheme(getTmaThemeSnapshot());
const initialSafeArea = getTmaSafeAreaSnapshot();
captureSafeAreaMetrics(initialSafeArea);
const initialViewport = getTmaViewportMetrics();
captureViewportMetrics(initialViewport);

const globalRuntime = globalThis as typeof globalThis & {
  __tmaRuntimeDisposers__?: VoidFunction[];
};

globalRuntime.__tmaRuntimeDisposers__?.forEach(dispose => {
  try {
    dispose();
  } catch (error) {
    logger.warn('Failed to dispose previous TMA runtime listener', { error });
  }
});

const runtimeDisposers: VoidFunction[] = [
  onTmaSafeAreaChange(snapshot => {
    captureSafeAreaMetrics(snapshot);
  }),
  onTmaViewportChange(metrics => {
    captureViewportMetrics(metrics);
  }),
];

globalRuntime.__tmaRuntimeDisposers__ = runtimeDisposers;

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    runtimeDisposers.forEach(dispose => {
      try {
        dispose();
      } catch (error) {
        logger.warn('Failed to dispose TMA runtime listener on HMR', { error });
      }
    });
    if (globalRuntime.__tmaRuntimeDisposers__ === runtimeDisposers) {
      delete globalRuntime.__tmaRuntimeDisposers__;
    }
  });
}

authStore.hydrate();
sessionManager.syncFromStore();
onTmaThemeChange(theme => uiStore.updateTheme(theme));
installSafeAreaDebugCommand();

if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'test')) {
  window.__telemetryEvents = window.__telemetryEvents ?? [];
  window.__tmaDebug = {
    ...(window.__tmaDebug ?? {}),
    requestFullscreen: () => {
      void requestFullscreen();
    },
    exitFullscreen: () => {
      void exitFullscreen();
    },
  };

  const hooks = {
    openAuthError(message = 'Тестовая ошибка авторизации') {
      uiStore.openAuthError(message);
    },
    dismissAuthError() {
      uiStore.dismissAuthError();
    },
    simulateLevelUp(targetLevel: number = useGameStore.getState().level + 1) {
      const current = useGameStore.getState();
      const nextLevel = Number.isFinite(targetLevel)
        ? Math.max(current.level + 1, Math.floor(targetLevel))
        : current.level + 1;
      useGameStore.setState({ level: nextLevel });
    },
    setReduceMotion(enabled: boolean) {
      usePreferencesStore.setState({ reduceMotion: enabled });
    },
    setFullscreenState(isFullscreen: boolean) {
      uiStore.debugSetFullscreenState(isFullscreen);
    },
  };

  window.__APP_TEST_HOOKS__ = hooks;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
