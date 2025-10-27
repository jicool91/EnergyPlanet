import { useEffect } from 'react';
import { withTmaBackButton } from '@/services/tma/backButton';

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

    return withTmaBackButton(handler);
  }, [enabled, handler]);
}
