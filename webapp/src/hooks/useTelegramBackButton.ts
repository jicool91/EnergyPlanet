import { useEffect } from 'react';
import { withTelegramBackButton } from '../services/telegram';

type UseTelegramBackButtonOptions = {
  enabled?: boolean;
};

export function useTelegramBackButton(
  handler: () => void,
  options: UseTelegramBackButtonOptions = {}
) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return withTelegramBackButton(handler);
  }, [enabled, handler]);
}
