import { invoice } from '@tma.js/sdk';
import type { InvoiceStatus } from '@tma.js/bridge';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

function isSupported(): boolean {
  ensureTmaSdkReady();
  return isTmaSdkAvailable() && invoice.isSupported();
}

export async function openTmaInvoiceBySlug(slug: string): Promise<InvoiceStatus | null> {
  if (!slug || !isSupported()) {
    return null;
  }

  try {
    return await invoice.openSlug(slug);
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
    return await invoice.openUrl(url);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('invoice.openUrl failed', error);
    }
    return null;
  }
}
