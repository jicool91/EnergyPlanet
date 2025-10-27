import { useEffect } from 'react';
import { hideTelegramMainButton, withTelegramMainButton } from '../services/telegram';
import { isTmaFeatureEnabled } from '@/config/tmaFlags';
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

const attachMainButton = isTmaFeatureEnabled('mainButton')
  ? withTmaMainButton
  : withTelegramMainButton;
const hideMainButton = isTmaFeatureEnabled('mainButton')
  ? hideTmaMainButton
  : hideTelegramMainButton;

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
      hideMainButton();
      return undefined;
    }

    return attachMainButton({
      text,
      onClick,
      color,
      textColor,
      disabled,
      showProgress,
      keepVisibleOnUnmount,
    });
  }, [
    enabled,
    text,
    onClick,
    color,
    textColor,
    disabled,
    showProgress,
    keepVisibleOnUnmount,
  ]);
}
