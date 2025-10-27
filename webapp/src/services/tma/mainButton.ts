import { mainButton } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

type MainButtonOptions = {
  text: string;
  onClick: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  showProgress?: boolean;
  keepVisibleOnUnmount?: boolean;
};

const activeHandlers = new Set<() => void>();

function toRgb(value?: string): `#${string}` | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  if (value.startsWith('#')) {
    return value as `#${string}`;
  }
  return null;
}

function applyConfig(options: MainButtonOptions) {
  mainButton.setText(options.text);

  const bgColor = toRgb(options.color);
  if (bgColor) {
    mainButton.setBgColor(bgColor);
  }

  const textColor = toRgb(options.textColor);
  if (textColor) {
    mainButton.setTextColor(textColor);
  }

  if (options.disabled) {
    mainButton.disable();
  } else {
    mainButton.enable();
  }
}

export function withTmaMainButton(options: MainButtonOptions): () => void {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    return () => {};
  }

  if (!mainButton.isMounted()) {
    mainButton.mount();
  }

  applyConfig(options);

  const handler = () => {
    if (options.showProgress) {
      mainButton.showLoader();
    }
    try {
      options.onClick();
    } finally {
      if (options.showProgress) {
        mainButton.hideLoader();
      }
    }
  };

  mainButton.onClick(handler);
  activeHandlers.add(handler);

  if (!mainButton.isVisible()) {
    mainButton.show();
  }

  return () => {
    mainButton.offClick(handler);
    activeHandlers.delete(handler);

    if (options.showProgress) {
      mainButton.hideLoader();
    }

    if (!options.keepVisibleOnUnmount && activeHandlers.size === 0) {
      mainButton.hideLoader();
      mainButton.hide();
    }
  };
}

export function hideTmaMainButton(): void {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    return;
  }

  activeHandlers.clear();
  mainButton.hideLoader();
  mainButton.hide();
}
