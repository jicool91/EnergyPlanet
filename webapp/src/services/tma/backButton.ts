import { backButton } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';

function getBackButton() {
  const runtime = getTmaRuntimeSnapshot();
  if (runtime) {
    return runtime.backButton;
  }
  ensureTmaSdkReady();
  return backButton;
}

export function withTmaBackButton(handler: () => void): () => void {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    return () => {};
  }

  const button = getBackButton();
  if (!button.isSupported()) {
    return () => {};
  }

  if (!button.isMounted()) {
    button.mount();
  }

  const wasVisible = button.isVisible();
  button.show();
  button.onClick(handler);

  return () => {
    button.offClick(handler);
    if (!wasVisible) {
      button.hide();
    }
  };
}
