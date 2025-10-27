import { useEffect } from 'react';
import { hideTmaMainButton, withTmaMainButton } from '@/services/tma/mainButton';

type UseTelegramMainButtonOptions = {
  text: string;
  onClick: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  showProgress?: boolean;
  enabled?: boolean;
  keepVisibleOnUnmount?: boolean;
};

export function useTelegramMainButton(options: UseTelegramMainButtonOptions) {
  const {
    text,
    onClick,
    color,
    textColor,
    disabled = false,
    showProgress = false,
    enabled = true,
    keepVisibleOnUnmount = false,
  } = options;

  useEffect(() => {
    if (!enabled) {
      hideTmaMainButton();
      return undefined;
    }

    return withTmaMainButton({
      text,
      onClick,
      color,
      textColor,
      disabled,
      showProgress,
      keepVisibleOnUnmount,
    });
  }, [enabled, text, onClick, color, textColor, disabled, showProgress, keepVisibleOnUnmount]);
}
