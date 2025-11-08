import { useSignal } from '@tma.js/sdk-react';
import { miniApp, themeParams } from '@tma.js/sdk';
import { useMemo } from 'react';
import { getTmaThemeSnapshot, type ThemeSnapshot } from '@/services/tma/theme';

interface ThemeSignal {
  theme: ThemeSnapshot;
  headerColor: string | undefined;
}

export function useThemeSignal(): ThemeSignal {
  const snapshot = useSignal(themeParams.state, () => getTmaThemeSnapshot());

  return useMemo(() => {
    const headerColor = snapshot.header_color ?? snapshot.bg_color;
    if (typeof miniApp.headerColor === 'function') {
      const runtimeHeader = miniApp.headerColor();
      return {
        theme: snapshot,
        headerColor: runtimeHeader ?? headerColor,
      };
    }
    return { theme: snapshot, headerColor };
  }, [snapshot]);
}
