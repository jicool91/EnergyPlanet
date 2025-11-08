import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { SDKProvider } from '@tma.js/sdk-react';
import {
  backButton,
  cloudStorage,
  hapticFeedback,
  miniApp,
  mainButton,
  swipeBehavior,
  themeParams,
  viewport,
} from '@tma.js/sdk';
import { ensureTmaSdkReady, disposeTmaSdk } from '@/services/tma/core';
import { logger } from '@/utils/logger';
import { logClientEvent } from '@/services/telemetry';
import { uiStore } from '@/store/uiStore';
import {
  captureSafeAreaMetrics,
  captureViewportMetrics,
  installSafeAreaDebugCommand,
} from '@/tma/renderMetrics';
import {
  getTmaSafeAreaSnapshot,
  getTmaViewportMetrics,
  onTmaSafeAreaChange,
  onTmaViewportChange,
  requestFullscreen,
  exitFullscreen,
} from '@/services/tma/viewport';
import { getTmaThemeSnapshot, onTmaThemeChange } from '@/services/tma/theme';
import { initializeTelegramTheme } from '@/utils/telegramTheme';
import { setTmaRuntime } from '@/tma/runtimeState';

export interface TmaRuntimeContextValue {
  ready: boolean;
  miniApp: typeof miniApp;
  viewport: typeof viewport;
  themeParams: typeof themeParams;
  mainButton: typeof mainButton;
  backButton: typeof backButton;
  cloudStorage: typeof cloudStorage;
  swipeBehavior: typeof swipeBehavior;
  hapticFeedback: typeof hapticFeedback;
}

export const TmaRuntimeContext = createContext<TmaRuntimeContextValue | null>(null);

export function TmaSdkProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let disposers: VoidFunction[] = [];
    try {
      ensureTmaSdkReady();
      void logClientEvent('sdk_provider_init', { status: 'success' });

      initializeTelegramTheme();
      uiStore.updateTheme(getTmaThemeSnapshot());
      captureSafeAreaMetrics(getTmaSafeAreaSnapshot());
      captureViewportMetrics(getTmaViewportMetrics());
      installSafeAreaDebugCommand();

      disposers = [
        onTmaSafeAreaChange(snapshot => {
          captureSafeAreaMetrics(snapshot);
        }),
        onTmaViewportChange(metrics => {
          captureViewportMetrics(metrics);
        }),
        onTmaThemeChange(theme => {
          uiStore.updateTheme(theme);
        }),
      ];

      if (typeof window !== 'undefined') {
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
      }
      setTmaRuntime({
        ready: true,
        miniApp,
        viewport,
        themeParams,
        mainButton,
        backButton,
        cloudStorage,
        swipeBehavior,
        hapticFeedback,
      });
    } catch (error) {
      logger.error('Failed to initialize TMA SDK', { error });
      void logClientEvent('sdk_provider_init', { status: 'failed', error }, 'error');
      void logClientEvent('sdk_provider_error', { error }, 'error');
    }

    return () => {
      disposers.forEach(dispose => {
        try {
          dispose();
        } catch (error) {
          logger.warn('Failed to dispose TMA runtime listener', { error });
        }
      });
      setTmaRuntime(null);
      disposeTmaSdk();
    };
  }, []);

  const value = useMemo<TmaRuntimeContextValue>(() => {
    return {
      ready: true,
      miniApp,
      viewport,
      themeParams,
      mainButton,
      backButton,
      cloudStorage,
      swipeBehavior,
      hapticFeedback,
    };
  }, []);

  return (
    <SDKProvider>
      <TmaRuntimeContext.Provider value={value}>{children}</TmaRuntimeContext.Provider>
    </SDKProvider>
  );
}

export function useTmaRuntime(): TmaRuntimeContextValue {
  const ctx = useContext(TmaRuntimeContext);
  if (!ctx) {
    throw new Error('useTmaRuntime must be used inside TmaSdkProvider');
  }
  return ctx;
}
