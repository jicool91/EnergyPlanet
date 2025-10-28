import { getRedis } from './redis';
import { logger } from '../utils/logger';

const KEY_PREFIX = 'tma:init';

export type InitReplayStatus = 'fresh' | 'replay' | 'skipped';

const buildKey = (hash: string) => `${KEY_PREFIX}:${hash}`;

export async function registerInitDataHash(
  hash: string,
  ttlSeconds: number
): Promise<InitReplayStatus> {
  if (ttlSeconds <= 0) {
    logger.debug({ ttlSeconds }, 'telegram_initdata_replay_skip_ttl_disabled');
    return 'skipped';
  }

  try {
    const redis = getRedis();
    const result = await redis.set(buildKey(hash), Date.now().toString(), {
      NX: true,
      EX: ttlSeconds,
    });

    if (result === null) {
      return 'replay';
    }

    return 'fresh';
  } catch (error) {
    logger.warn(
      {
        error: (error as Error).message,
      },
      'telegram_initdata_replay_cache_unavailable'
    );
    return 'skipped';
  }
}
