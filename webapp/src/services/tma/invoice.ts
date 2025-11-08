import { invoice } from '@tma.js/sdk';
import type { InvoiceStatus } from '@tma.js/bridge';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';

function getInvoice() {
  const runtime = getTmaRuntimeSnapshot();
  if (!runtime) {
    ensureTmaSdkReady();
  }
  return invoice;
}

function isSupported(): boolean {
  const instance = getInvoice();
  return isTmaSdkAvailable() && instance.isSupported();
}

export async function openTmaInvoiceBySlug(slug: string): Promise<InvoiceStatus | null> {
  if (!slug || !isSupported()) {
    return null;
  }

  try {
    return await getInvoice().openSlug(slug);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('invoice.openSlug failed', error);
    }
    return null;
  }
}

export async function openTmaInvoiceByUrl(url: string): Promise<InvoiceStatus | null> {
  if (!url || !isSupported()) {
    return null;
  }

  try {
    return await getInvoice().openUrl(url);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('invoice.openUrl failed', error);
    }
    return null;
  }
}
