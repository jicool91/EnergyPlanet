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

// Export logger to window for debugging
declare global {
  interface Window {
    _energyLogs?: typeof logger;
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
