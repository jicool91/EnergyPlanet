import { useEffect } from 'react';
import { hideTelegramMainButton, withTelegramMainButton } from '../services/telegram';

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
      hideTelegramMainButton();
      return undefined;
    }

    return withTelegramMainButton({
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
