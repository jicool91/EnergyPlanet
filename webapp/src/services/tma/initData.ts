import { retrieveRawInitData } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';

export function getTmaInitData(): string {
  const runtime = getTmaRuntimeSnapshot();
  if (!runtime) {
    ensureTmaSdkReady();
  }

  if (!isTmaSdkAvailable()) {
    return '';
  }

  const initData = retrieveRawInitData();
  return typeof initData === 'string' ? initData : '';
}
