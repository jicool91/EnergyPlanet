import { retrieveRawInitData } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';
import { logger } from '@/utils/logger';

export function getTmaInitData(): string {
  const runtime = getTmaRuntimeSnapshot();
  if (!runtime) {
    ensureTmaSdkReady();
  }

  // Prefer official SDK helper first
  const initData = retrieveRawInitData();
  if (typeof initData === 'string' && initData.trim().length > 0) {
    return initData;
  }

  // Fallback to Telegram.WebApp.initData in case SDK probe failed or returned empty
  const webAppInitData = window.Telegram?.WebApp?.initData;
  if (typeof webAppInitData === 'string' && webAppInitData.trim().length > 0) {
    logger.warn(
      'getTmaInitData: retrieveRawInitData empty, using Telegram.WebApp.initData fallback'
    );
    return webAppInitData;
  }

  if (!isTmaSdkAvailable()) {
    logger.warn('getTmaInitData: TMA SDK not available and no initData fallback');
  }

  return '';
}
