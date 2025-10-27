import { cloudStorage } from '@tma.js/sdk';
import { ensureTmaSdkReady, isTmaSdkAvailable } from './core';

function isSupported(): boolean {
  ensureTmaSdkReady();
  return isTmaSdkAvailable() && cloudStorage.isSupported();
}

export function isCloudStorageAvailable(): boolean {
  return isSupported();
}

export async function cloudStorageSetItem(key: string, value: string): Promise<void> {
  if (!isSupported()) {
    return;
  }

  await cloudStorage.setItem(key, value);
}

export async function cloudStorageGetItem(key: string): Promise<string | null> {
  if (!isSupported()) {
    return null;
  }

  try {
    const value = await cloudStorage.getItem(key);
    return typeof value === 'string' ? value : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('CloudStorage.getItem failed', error);
    }
    return null;
  }
}

export async function cloudStorageRemoveItem(key: string): Promise<void> {
  if (!isSupported()) {
    return;
  }

  await cloudStorage.deleteItem(key);
}

export async function cloudStorageGetItems(keys: string[]): Promise<Record<string, string>> {
  if (!isSupported()) {
    return {};
  }

  try {
    return await cloudStorage.getItems(keys);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('CloudStorage.getItems failed', error);
    }
    return {};
  }
}

export async function cloudStorageGetKeys(): Promise<string[]> {
  if (!isSupported()) {
    return [];
  }

  try {
    return await cloudStorage.getKeys();
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug('CloudStorage.getKeys failed', error);
    }
    return [];
  }
}

export { cloudStorageRemoveItem as cloudStorageDeleteItem };
