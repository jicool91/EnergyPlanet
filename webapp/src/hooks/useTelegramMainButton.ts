import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getActionToneHex, type ActionTone } from '@/components/ui/actionTheme';
import { useTmaRuntime } from '@/providers/TmaSdkProvider';

interface UseTelegramMainButtonOptions {
  text: string;
  onClick: () => void;
  color?: string;
  textColor?: string;
  tone?: ActionTone;
  disabled?: boolean;
  showProgress?: boolean;
  enabled?: boolean;
  keepVisibleOnUnmount?: boolean;
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

function resolveButtonColors(
  options: UseTelegramMainButtonOptions,
  themeParams: typeof import('@tma.js/sdk').themeParams
): {
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
    // ignore state errors, fallback below
  }

  const background = toRgb(options.color ?? themeBg ?? '#f3ba2f');
  const foreground = toRgb(options.textColor ?? themeFg ?? '#000000');

  return { background, foreground };
}

function hideMainButton(
  mainButton: typeof import('@tma.js/sdk').mainButton,
  hideLoader = false
): void {
  if (hideLoader) {
    try {
      mainButton.hideLoader();
    } catch {
      /* ignore */
    }
  }
  try {
    mainButton.hide();
  } catch {
    /* ignore */
  }
}

export function useTelegramMainButton(options: UseTelegramMainButtonOptions) {
  const {
    text,
    onClick,
    color,
    textColor,
    tone,
    disabled = false,
    showProgress = false,
    enabled = true,
    keepVisibleOnUnmount = false,
  } = options;
  const location = useLocation();
  const { mainButton, themeParams } = useTmaRuntime();
  const locationKey = `${location.pathname}${location.search ?? ''}`;

  useEffect(() => {
    if (!enabled) {
      hideMainButton(mainButton, showProgress);
      return undefined;
    }

    try {
      if (!mainButton.isMounted()) {
        mainButton.mount();
      }
      mainButton.show();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('mainButton mount/show failed', error);
      }
      return undefined;
    }

    mainButton.setText(text);
    const { background, foreground } = resolveButtonColors(
      {
        text,
        onClick,
        color,
        textColor,
        tone,
        disabled,
        showProgress,
        enabled,
        keepVisibleOnUnmount,
      },
      themeParams
    );

    if (background) {
      try {
        mainButton.setBgColor(background);
      } catch {
        // ignore bridge failures
      }
    }

    if (foreground) {
      try {
        mainButton.setTextColor(foreground);
      } catch {
        // ignore bridge failures
      }
    }

    if (disabled) {
      mainButton.disable();
    } else {
      mainButton.enable();
    }

    let loaderVisible = false;
    const handler = () => {
      if (showProgress) {
        try {
          mainButton.showLoader();
          loaderVisible = true;
        } catch {
          loaderVisible = false;
        }
      }
      try {
        onClick();
      } finally {
        if (showProgress && loaderVisible) {
          try {
            mainButton.hideLoader();
          } catch {
            // ignore
          } finally {
            loaderVisible = false;
          }
        }
      }
    };

    mainButton.onClick(handler);

    return () => {
      try {
        mainButton.offClick(handler);
      } catch {
        // ignore
      }

      if (!keepVisibleOnUnmount) {
        hideMainButton(mainButton, loaderVisible);
      } else if (loaderVisible) {
        try {
          mainButton.hideLoader();
        } catch {
          /* ignore */
        }
      }
    };
  }, [
    mainButton,
    themeParams,
    text,
    onClick,
    color,
    textColor,
    tone,
    disabled,
    showProgress,
    enabled,
    keepVisibleOnUnmount,
    locationKey,
  ]);
}
