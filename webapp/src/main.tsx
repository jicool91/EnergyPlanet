import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TmaSdkProvider } from './providers/TmaSdkProvider';
import './index.css';
import { authStore } from './store/authStore';
import { uiStore } from './store/uiStore';
import { logger } from './utils/logger';
import { sessionManager } from './services/sessionManager';
import { useGameStore } from './store/gameStore';
import { usePreferencesStore } from './store/preferencesStore';

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

function installAppTestHooks() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    return;
  }

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

window._energyLogs = logger;

authStore.hydrate();
sessionManager.syncFromStore();
installAppTestHooks();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TmaSdkProvider>
      <App />
    </TmaSdkProvider>
  </React.StrictMode>
);
