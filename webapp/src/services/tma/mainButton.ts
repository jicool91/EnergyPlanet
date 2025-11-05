import { mainButton, themeParams } from '@tma.js/sdk';
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
let loaderVisible = false;

function toRgb(value?: string): `#${string}` | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  if (value.startsWith('#')) {
    return value as `#${string}`;
  }
  return null;
}

function resolveButtonColors(options: MainButtonOptions): {
  background: `#${string}` | null;
  foreground: `#${string}` | null;
} {
  let themeBg: string | undefined;
  let themeFg: string | undefined;

  try {
    const state = themeParams.state();
    if (state) {
      if (typeof state.button_color === 'string') {
        themeBg = state.button_color;
      } else if (typeof state.accent_text_color === 'string') {
        themeBg = state.accent_text_color;
      }
      if (typeof state.button_text_color === 'string') {
        themeFg = state.button_text_color;
      }
    }
  } catch {
    // themeParams.state can throw if SDK not mounted; ignore and use fallbacks.
  }

  const background = toRgb(options.color ?? themeBg ?? '#f3ba2f');
  const foreground = toRgb(options.textColor ?? themeFg ?? '#000000');

  return { background, foreground };
}

function applyConfig(options: MainButtonOptions) {
  mainButton.setText(options.text);

  const { background, foreground } = resolveButtonColors(options);
  if (background) {
    mainButton.setBgColor(background);
  }

  if (foreground) {
    mainButton.setTextColor(foreground);
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

  if (!mainButton.isVisible()) {
    mainButton.show();
  }

  applyConfig(options);

  const handler = () => {
    if (options.showProgress) {
      try {
        mainButton.showLoader();
        loaderVisible = true;
      } catch {
        loaderVisible = false;
      }
    }
    try {
      options.onClick();
    } finally {
      if (options.showProgress && loaderVisible) {
        try {
          mainButton.hideLoader();
        } catch {
          // ignore bridge errors
        } finally {
          loaderVisible = false;
        }
      }
    }
  };

  mainButton.onClick(handler);
  activeHandlers.add(handler);

  return () => {
    mainButton.offClick(handler);
    activeHandlers.delete(handler);

    if (options.showProgress && loaderVisible) {
      try {
        mainButton.hideLoader();
      } catch {
        // ignore bridge errors
      } finally {
        loaderVisible = false;
      }
    }

    if (!options.keepVisibleOnUnmount && activeHandlers.size === 0) {
      if (loaderVisible) {
        try {
          mainButton.hideLoader();
        } catch {
          // ignore
        } finally {
          loaderVisible = false;
        }
      }
      if (mainButton.isVisible()) {
        try {
          mainButton.hide();
        } catch {
          // ignore
        }
      }
    }
  };
}

export function hideTmaMainButton(): void {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    return;
  }

  activeHandlers.clear();
  if (loaderVisible) {
    try {
      mainButton.hideLoader();
    } catch {
      // ignore
    } finally {
      loaderVisible = false;
    }
  }
  if (mainButton.isVisible()) {
    try {
      mainButton.hide();
    } catch {
      // ignore
    }
  }
}
