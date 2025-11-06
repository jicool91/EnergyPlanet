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
  getTmaSafeAreaSnapshot,
  getTmaViewportMetrics,
  onTmaSafeAreaChange,
  onTmaViewportChange,
} from '@/services/tma/viewport';
import { sessionManager } from './services/sessionManager';
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
    };
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
getTmaSafeAreaSnapshot();
getTmaViewportMetrics();

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
  onTmaSafeAreaChange(() => {
    // viewport service already applies CSS vars; listener exists to trigger mount/update.
  }),
  onTmaViewportChange(() => {
    // see above: ensure CSS variables sync with Telegram runtime.
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

if (typeof window !== 'undefined' && (import.meta.env.DEV || import.meta.env.MODE === 'test')) {
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
  };

  window.__APP_TEST_HOOKS__ = hooks;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
