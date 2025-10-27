import { viewport } from '@tma.js/sdk';
import type { SafeAreaInsets } from '@tma.js/bridge';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { HEADER_BUFFER_PX, HEADER_RESERVE_PX } from '@/constants/layout';

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

function applySafeAreaCss(snapshot: SafeAreaSnapshot): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  const { safe, content } = snapshot;

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

  root.style.setProperty('--app-header-reserve', `${HEADER_RESERVE_PX}px`);
  root.style.setProperty('--app-header-buffer', `${HEADER_BUFFER_PX}px`);
  root.style.setProperty('--app-content-base-top', `${contentBaseInset}px`);
  root.style.setProperty('--app-header-offset-top', `${headerOffset}px`);
  root.style.setProperty('--app-content-padding-top', `${contentPaddingTop}px`);
}

function applyViewportCss(metrics: ViewportMetrics): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (typeof metrics.height === 'number') {
    root.style.setProperty('--tg-viewport-height', `${metrics.height}px`);
  }
  if (typeof metrics.stableHeight === 'number') {
    root.style.setProperty('--tg-viewport-stable-height', `${metrics.stableHeight}px`);
  }
  if (typeof metrics.width === 'number') {
    root.style.setProperty('--tg-viewport-width', `${metrics.width}px`);
  }
  root.style.setProperty('--tg-viewport-is-expanded', metrics.isExpanded ? '1' : '0');
  root.style.setProperty('--tg-viewport-is-stable', metrics.isStateStable ? '1' : '0');
  root.style.setProperty('--tg-viewport-is-fullscreen', metrics.isFullscreen ? '1' : '0');
  root.style.setProperty('--tg-fullscreen', metrics.isFullscreen ? '1' : '0');
  root.dataset.tgViewportExpanded = metrics.isExpanded ? 'true' : 'false';
  root.dataset.tgViewportStable = metrics.isStateStable ? 'true' : 'false';
  root.dataset.tgViewportFullscreen = metrics.isFullscreen ? 'true' : 'false';
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

function updateSafeArea(snapshot: SafeAreaSnapshot): SafeAreaSnapshot {
  currentSafeArea = snapshot;
  applySafeAreaCss(snapshot);
  return snapshot;
}

function updateViewport(metrics: ViewportMetrics): ViewportMetrics {
  currentViewport = metrics;
  applyViewportCss(metrics);
  return metrics;
}

export function getTmaSafeAreaSnapshot(): SafeAreaSnapshot {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return updateSafeArea({ safe: ZERO_INSETS, content: ZERO_INSETS });
  }
  return updateSafeArea(readSafeAreaSnapshot());
}

export function getTmaViewportMetrics(): ViewportMetrics {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return updateViewport({ ...DEFAULT_VIEWPORT_METRICS });
  }
  return updateViewport(readViewportMetrics());
}

export function onTmaSafeAreaChange(listener: Listener<SafeAreaSnapshot>): VoidFunction {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    listener(updateSafeArea({ safe: ZERO_INSETS, content: ZERO_INSETS }));
    return () => {};
  }

  const notify = () => listener(updateSafeArea(readSafeAreaSnapshot()));
  const unsubscribe = viewport.state.sub(notify);
  notify();
  return () => {
    unsubscribe();
  };
}

export function onTmaViewportChange(listener: Listener<ViewportMetrics>): VoidFunction {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    listener(updateViewport({ ...DEFAULT_VIEWPORT_METRICS }));
    return () => {};
  }

  const notify = () => listener(updateViewport(readViewportMetrics()));
  const unsubscribe = viewport.state.sub(notify);
  notify();
  return () => {
    unsubscribe();
  };
}

export function getCachedSafeArea(): SafeAreaSnapshot {
  return currentSafeArea;
}

export function getCachedViewportMetrics(): ViewportMetrics {
  return currentViewport;
}
