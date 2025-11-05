import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search ?? ''}`;

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
  }, [
    enabled,
    text,
    onClick,
    color,
    textColor,
    disabled,
    showProgress,
    keepVisibleOnUnmount,
    locationKey,
  ]);
}
