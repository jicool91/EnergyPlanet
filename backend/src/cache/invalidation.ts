import config from '../config';
import { cacheKeys } from './cacheKeys';
import { delCache } from './redis';

export async function invalidateProfileCache(userId: string): Promise<void> {
  if (!config.cache.enabled) {
    return;
  }
  await delCache(cacheKeys.profile(userId));
}
