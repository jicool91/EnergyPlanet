import { backButton } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

export function withTmaBackButton(handler: () => void): () => void {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable() || !backButton.isSupported()) {
    return () => {};
  }

  if (!backButton.isMounted()) {
    backButton.mount();
  }

  const wasVisible = backButton.isVisible();
  backButton.show();
  backButton.onClick(handler);

  return () => {
    backButton.offClick(handler);
    if (!wasVisible) {
      backButton.hide();
    }
  };
}
