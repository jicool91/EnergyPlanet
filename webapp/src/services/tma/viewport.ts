import { viewport } from '@tma.js/sdk';
import type { SafeAreaInsets } from '@tma.js/bridge';
import type { SafeAreaSnapshot, ViewportMetrics } from '../telegram';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

const ZERO_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };

function readSafeAreaSnapshot(): SafeAreaSnapshot {
  const safe = viewport.safeAreaInsets();
  const content = viewport.contentSafeAreaInsets();
  return {
    safe: safe ?? ZERO_INSETS,
    content: content ?? ZERO_INSETS,
  };
}

function readViewportMetrics(): ViewportMetrics {
  const height = viewport.height();
  const stableHeight = viewport.stableHeight();
  const width = viewport.width();
  const isExpanded = viewport.isExpanded();
  const isStateStable = viewport.isStable();
  return {
    height: Number.isFinite(height) ? height : null,
    stableHeight: Number.isFinite(stableHeight) ? stableHeight : null,
    width: Number.isFinite(width) ? width : null,
    isExpanded: Boolean(isExpanded),
    isStateStable: Boolean(isStateStable),
  };
}

type Listener<T> = (value: T) => void;

export function getTmaSafeAreaSnapshot(): SafeAreaSnapshot {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return { safe: ZERO_INSETS, content: ZERO_INSETS };
  }
  return readSafeAreaSnapshot();
}

export function getTmaViewportMetrics(): ViewportMetrics {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return {
      height: null,
      stableHeight: null,
      width: null,
      isExpanded: true,
      isStateStable: true,
    };
  }
  return readViewportMetrics();
}

export function onTmaSafeAreaChange(listener: Listener<SafeAreaSnapshot>): VoidFunction {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return () => {};
  }

  const notify = () => listener(readSafeAreaSnapshot());
  const unsubscribe = viewport.state.sub(notify);
  notify();
  return () => {
    unsubscribe();
  };
}

export function onTmaViewportChange(listener: Listener<ViewportMetrics>): VoidFunction {
  ensureTmaSdkReady();
  if (!isTmaSdkAvailable()) {
    return () => {};
  }

  const notify = () => listener(readViewportMetrics());
  const unsubscribe = viewport.state.sub(notify);
  notify();
  return () => {
    unsubscribe();
  };
}
