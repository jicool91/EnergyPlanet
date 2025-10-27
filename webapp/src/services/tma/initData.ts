import { retrieveRawInitData } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

export function getTmaInitData(): string {
  ensureTmaSdkReady();

  if (!isTmaSdkAvailable()) {
    return '';
  }

  const initData = retrieveRawInitData();
  return typeof initData === 'string' ? initData : '';
}
