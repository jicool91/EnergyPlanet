import type { SafeAreaSnapshot, ViewportMetrics } from '@/services/tma/viewport';
import { uiStore } from '@/store/uiStore';
import { logger } from '@/utils/logger';
import { getCachedSafeArea } from '@/services/tma/viewport';

export type RenderMetricsShape = {
  app: number;
  safeAreaTop?: number;
  contentSafeAreaTop?: number;
  isFullscreen?: boolean;
};

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

export function captureSafeAreaMetrics(snapshot: SafeAreaSnapshot) {
  const safeAreaTop = Math.max(0, snapshot.safe.top ?? 0);
  const contentSafeAreaTop = Math.max(0, snapshot.content.top ?? 0);

  updateRenderMetrics({
    safeAreaTop,
    contentSafeAreaTop,
  });
}

export function captureViewportMetrics(metrics: ViewportMetrics) {
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

export function installSafeAreaDebugCommand() {
  if (typeof window === 'undefined') {
    return;
  }

  const runDebugCommand = (command: string) => {
    if (command !== '/debug_safe_area') {
      logger.warn('[dev-command] Unknown command', { command });
      return false;
    }

    const safeArea = getCachedSafeArea();
    const renderMetrics = window.__renderMetrics;

    logger.info('[/debug_safe_area] Safe area snapshot', {
      safeArea,
      renderMetrics,
    });

    if (typeof console.group === 'function') {
      console.group('/debug_safe_area');
    }
    console.log('safeArea.safe', safeArea.safe);
    console.log('safeArea.content', safeArea.content);
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
