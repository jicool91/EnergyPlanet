import { useEffect } from 'react';
import { useTmaRuntime } from '@/providers/TmaSdkProvider';

interface UseTelegramBackButtonOptions {
  enabled?: boolean;
}

export function useTelegramBackButton(
  handler: () => void,
  options: UseTelegramBackButtonOptions = {}
) {
  const { enabled = true } = options;
  const { backButton } = useTmaRuntime();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let wasVisible = false;
    try {
      if (!backButton.isMounted()) {
        backButton.mount();
      }
      wasVisible = backButton.isVisible();
      backButton.show();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('backButton mount/show failed', error);
      }
      return undefined;
    }

    const clickHandler = () => {
      try {
        handler();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('Back button handler threw', error);
        }
      }
    };

    backButton.onClick(clickHandler);

    return () => {
      try {
        backButton.offClick(clickHandler);
      } catch {
        // ignore
      }

      if (!wasVisible) {
        try {
          backButton.hide();
        } catch {
          // ignore
        }
      }
    };
  }, [backButton, enabled, handler]);
}
