/**
 * Redis Connection and Cache Helpers
 * Подключение к Redis с хелперами для кеширования
 */

import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  if (config.redis.url) {
    redisClient = createClient({
      url: config.redis.url,
    });
  } else {
    redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
        tls: config.redis.tls,
      },
      password: config.redis.password || undefined,
      database: config.redis.db,
    });
  }

  redisClient.on('error', (err) => {
    logger.error('❌ Redis error', err);
  });

  redisClient.on('connect', () => {
    logger.info('✅ Redis подключен');
  });

  redisClient.on('ready', () => {
    logger.info('✅ Redis готов к работе');
  });

  await redisClient.connect();

  // Тест подключения
  await redisClient.ping();
  logger.info('✅ Redis: PING успешен');

  return redisClient;
}

export function getRedis(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis() first.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('🔌 Redis: Подключение закрыто');
  }
}

/**
 * Кешировать значение
 */
export async function setCache(
  key: string,
  value: any,
  expirySeconds?: number
): Promise<void> {
  const client = getRedis();
  const serialized = JSON.stringify(value);

  if (expirySeconds) {
    await client.setEx(key, expirySeconds, serialized);
  } else {
    await client.set(key, serialized);
  }
}

/**
 * Получить значение из кеша
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  const client = getRedis();
  const value = await client.get(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('❌ Redis: Ошибка парсинга JSON', { key, error });
    return null;
  }
}

/**
 * Удалить ключ из кеша
 */
export async function delCache(key: string): Promise<void> {
  const client = getRedis();
  await client.del(key);
}

/**
 * Проверка здоровья Redis
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const client = getRedis();
    const pong = await client.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('❌ Redis health check failed', error);
    return false;
  }
}

/**
 * Очистить весь кеш (осторожно!)
 */
export async function flushCache(): Promise<void> {
  const client = getRedis();
  await client.flushDb();
  logger.warn('⚠️ Redis: Весь кеш очищен');
}
