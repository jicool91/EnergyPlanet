import { useEffect } from 'react';
import { withTelegramBackButton } from '../services/telegram';
import { isTmaFeatureEnabled } from '@/config/tmaFlags';
import { withTmaBackButton } from '@/services/tma/backButton';

type UseTelegramBackButtonOptions = {
  enabled?: boolean;
};

const attachBackButton = isTmaFeatureEnabled('backButton')
  ? withTmaBackButton
  : withTelegramBackButton;

export function useTelegramBackButton(
  handler: () => void,
  options: UseTelegramBackButtonOptions = {}
) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return attachBackButton(handler);
  }, [enabled, handler]);
}
