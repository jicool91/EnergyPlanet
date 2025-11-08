import type { ReactNode } from 'react';
import { TmaRuntimeContext, type TmaRuntimeContextValue } from './TmaSdkProvider';
import {
  miniApp,
  viewport,
  themeParams,
  mainButton,
  backButton,
  cloudStorage,
  swipeBehavior,
  hapticFeedback,
} from '@tma.js/sdk';

const DEFAULT_CONTEXT: TmaRuntimeContextValue = {
  ready: true,
  miniApp,
  viewport,
  themeParams,
  mainButton,
  backButton,
  cloudStorage,
  swipeBehavior,
  hapticFeedback,
};

interface MockTmaProviderProps {
  value?: Partial<TmaRuntimeContextValue>;
  children: ReactNode;
}

export function MockTmaProvider({ value, children }: MockTmaProviderProps) {
  const merged: TmaRuntimeContextValue = {
    ...DEFAULT_CONTEXT,
    ...value,
  };

  return <TmaRuntimeContext.Provider value={merged}>{children}</TmaRuntimeContext.Provider>;
}
