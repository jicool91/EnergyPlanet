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
import { ErrorBoundary } from './components/ErrorBoundary';
import { Text } from './components/ui/Text';

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

function RootErrorFallback() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-surface-primary px-6 text-center">
      <div className="flex max-w-md flex-col gap-4">
        <Text as="h1" variant="title" weight="semibold">
          Что-то пошло не так
        </Text>
        <Text tone="secondary">
          Приложение не смогло загрузиться. Попробуйте обновить страницу или открыть мини‑приложение
          заново в Telegram.
        </Text>
        <button
          type="button"
          className="mx-auto inline-flex items-center justify-center rounded-2xl bg-accent-gold px-5 py-3 text-body font-semibold text-surface-primary shadow-md transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
          onClick={() => window.location.reload()}
        >
          Перезагрузить
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary fallback={<RootErrorFallback />} onRetry={() => window.location.reload()}>
    <React.StrictMode>
      <TmaSdkProvider>
        <App />
      </TmaSdkProvider>
    </React.StrictMode>
  </ErrorBoundary>
);
