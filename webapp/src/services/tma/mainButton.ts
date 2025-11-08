import { mainButton, themeParams } from '@tma.js/sdk';
import { getActionToneHex, type ActionTone } from '@/components/ui/actionTheme';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';

type MainButtonOptions = {
  text: string;
  onClick: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  showProgress?: boolean;
  keepVisibleOnUnmount?: boolean;
  tone?: ActionTone;
};

const activeHandlers = new Set<() => void>();
let loaderVisible = false;

function getMainButton() {
  const runtime = getTmaRuntimeSnapshot();
  if (runtime) {
    return runtime.mainButton;
  }
  ensureTmaSdkReady();
  return mainButton;
}

function getThemeParams() {
  const runtime = getTmaRuntimeSnapshot();
  if (runtime) {
    return runtime.themeParams;
  }
  ensureTmaSdkReady();
  return themeParams;
}

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
  if (options.tone) {
    const { background, foreground } = getActionToneHex(options.tone);
    return { background, foreground };
  }

  let themeBg: string | undefined;
  let themeFg: string | undefined;

  try {
    const state = getThemeParams().state();
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

function applyConfig(options: MainButtonOptions, button: typeof mainButton) {
  button.setText(options.text);

  const { background, foreground } = resolveButtonColors(options);
  if (background) {
    button.setBgColor(background);
  }

  if (foreground) {
    button.setTextColor(foreground);
  }

  if (options.disabled) {
    button.disable();
  } else {
    button.enable();
  }
}

export function withTmaMainButton(options: MainButtonOptions): () => void {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    return () => {};
  }

  const button = getMainButton();

  if (!button.isMounted()) {
    button.mount();
  }

  if (!button.isVisible()) {
    button.show();
  }

  applyConfig(options, button);

  const handler = () => {
    if (options.showProgress) {
      try {
        button.showLoader();
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
          button.hideLoader();
        } catch {
          // ignore bridge errors
        } finally {
          loaderVisible = false;
        }
      }
    }
  };

  button.onClick(handler);
  activeHandlers.add(handler);

  return () => {
    button.offClick(handler);
    activeHandlers.delete(handler);

    if (options.showProgress && loaderVisible) {
      try {
        button.hideLoader();
      } catch {
        // ignore bridge errors
      } finally {
        loaderVisible = false;
      }
    }

    if (!options.keepVisibleOnUnmount && activeHandlers.size === 0) {
      if (loaderVisible) {
        try {
          button.hideLoader();
        } catch {
          // ignore
        } finally {
          loaderVisible = false;
        }
      }
      if (button.isVisible()) {
        try {
          button.hide();
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

  const button = getMainButton();

  activeHandlers.clear();
  if (loaderVisible) {
    try {
      button.hideLoader();
    } catch {
      // ignore
    } finally {
      loaderVisible = false;
    }
  }
  if (button.isVisible()) {
    try {
      button.hide();
    } catch {
      // ignore
    }
  }
}
