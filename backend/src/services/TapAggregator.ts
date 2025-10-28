import { RedisClientType } from 'redis';
import { getRedis } from '../cache/redis';
import { logger } from '../utils/logger';
import { transaction } from '../db/connection';
import { getProgress, updateProgress } from '../repositories/ProgressRepository';
import { calculateLevelProgress } from '../utils/level';
import { logEvent } from '../repositories/EventRepository';
import { createTapEvent } from '../repositories/TapEventRepository';
import { achievementService } from './AchievementService';

interface BufferTotals {
  taps: number;
  energy: number;
  baseEnergy: number;
  xp: number;
  updatedAt?: number;
}

interface BufferIncrement {
  taps: number;
  energy: number;
  baseEnergy: number;
  xp: number;
}

const BUFFER_TTL_SECONDS = 5;
const LOCK_TTL_MS = 1_000;

export class TapAggregator {
  private readonly redisKeyPrefix = 'tap';
  private readonly pendingSetKey = `${this.redisKeyPrefix}:pending`;
  private readonly flushIntervalMs: number;
  private readonly flushThreshold: number;
  private intervalHandle: NodeJS.Timeout | null = null;
  private readonly redisProvider: () => RedisClientType;

  constructor(
    options?: { flushIntervalMs?: number; flushThreshold?: number },
    redisProvider: () => RedisClientType = getRedis
  ) {
    this.flushIntervalMs = options?.flushIntervalMs ?? 500;
    this.flushThreshold = options?.flushThreshold ?? 50;
    this.redisProvider = redisProvider;
  }

  start() {
    if (this.intervalHandle) {
      return;
    }

    this.intervalHandle = setInterval(() => {
      this.flushPending().catch(error => {
        logger.error(
          {
            error: error instanceof Error ? error.message : String(error),
          },
          'tap_aggregator_periodic_flush_failed'
        );
      });
    }, this.flushIntervalMs);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private redis(): RedisClientType {
    return this.redisProvider();
  }

  private bufferKey(userId: string): string {
    return `${this.redisKeyPrefix}:${userId}`;
  }

  private lockKey(userId: string): string {
    return `${this.redisKeyPrefix}:${userId}:lock`;
  }

  async bufferTap(userId: string, increment: BufferIncrement): Promise<BufferTotals> {
    const redis = this.redis();
    const key = this.bufferKey(userId);
    const now = Date.now();

    const multi = redis.multi();
    multi.hIncrBy(key, 'tapCount', increment.taps);
    multi.hIncrByFloat(key, 'energy', increment.energy);
    multi.hIncrByFloat(key, 'baseEnergy', increment.baseEnergy);
    multi.hIncrByFloat(key, 'xp', increment.xp);
    multi.hSet(key, 'updatedAt', now.toString());
    multi.expire(key, BUFFER_TTL_SECONDS);
    multi.sAdd(this.pendingSetKey, userId);

    const results = await multi.exec();
    if (!results) {
      throw new Error('Failed to buffer tap batch in Redis');
    }

    const tapCount = Number(results?.[0] ?? increment.taps);
    const energy = Number(results?.[1] ?? increment.energy);
    const baseEnergy = Number(results?.[2] ?? increment.baseEnergy);
    const xp = Number(results?.[3] ?? increment.xp);

    if (tapCount >= this.flushThreshold) {
      this.flushUser(userId).catch(error => {
        logger.error(
          {
            userId,
            error: error instanceof Error ? error.message : String(error),
          },
          'tap_aggregator_threshold_flush_failed'
        );
      });
    }

    return {
      taps: tapCount,
      energy,
      baseEnergy,
      xp,
      updatedAt: now,
    };
  }

  async getPendingTotals(userId: string): Promise<BufferTotals> {
    const redis = this.redis();
    const key = this.bufferKey(userId);
    const [tapCountRaw, energyRaw, baseEnergyRaw, xpRaw] = await redis.hmGet(key, [
      'tapCount',
      'energy',
      'baseEnergy',
      'xp',
    ]);
    return {
      taps: tapCountRaw ? Number(tapCountRaw) : 0,
      energy: energyRaw ? Number(energyRaw) : 0,
      baseEnergy: baseEnergyRaw ? Number(baseEnergyRaw) : 0,
      xp: xpRaw ? Number(xpRaw) : 0,
    };
  }

  async flushPending(): Promise<void> {
    const redis = this.redis();
    const pendingUsers = await redis.sMembers(this.pendingSetKey);

    if (!pendingUsers.length) {
      return;
    }

    await Promise.all(
      pendingUsers.map(userId =>
        this.flushUser(userId).catch(error => {
          logger.error(
            {
              userId,
              error: error instanceof Error ? error.message : String(error),
            },
            'tap_aggregator_flush_failed'
          );
        })
      )
    );
  }

  async flushUser(userId: string): Promise<boolean> {
    const redis = this.redis();
    const lockKey = this.lockKey(userId);
    const lockResult = await redis.set(lockKey, Date.now().toString(), {
      NX: true,
      PX: LOCK_TTL_MS,
    });

    if (!lockResult) {
      return false;
    }

    try {
      const replies = await redis
        .multi()
        .hGetAll(this.bufferKey(userId))
        .del(this.bufferKey(userId))
        .sRem(this.pendingSetKey, userId)
        .exec();

      if (!replies || replies.length === 0) {
        return false;
      }

      const buffer = (replies[0] as unknown as Record<string, string>) ?? {};

      const taps = Number(buffer?.tapCount ?? 0);
      const energy = Number(buffer?.energy ?? 0);
      const baseEnergy = Number(buffer?.baseEnergy ?? 0);
      const xp = Number(buffer?.xp ?? 0);
      const updatedAt = buffer?.updatedAt ? Number(buffer.updatedAt) : Date.now();

      if (!taps || taps <= 0 || energy === 0) {
        return false;
      }

      const energyDelta = Math.round(energy);
      const baseEnergyDelta = Math.max(Math.round(baseEnergy), 0);
      const xpDelta = Math.round(xp);

      const latencyMs = Math.max(Date.now() - updatedAt, 0);

      await transaction(async client => {
        const progress = await getProgress(userId, client);
        if (!progress) {
          logger.warn({ userId }, 'tap_aggregator_progress_missing');
          return;
        }

        const totalEnergyProduced = progress.totalEnergyProduced + energyDelta;
        const totalTaps = progress.totalTaps + taps;
        const energyBalance = progress.energy + energyDelta;
        const totalXp = progress.xp + xpDelta;
        const levelInfo = calculateLevelProgress(totalXp);
        const leveledUp = levelInfo.level !== progress.level;

        await updateProgress(
          userId,
          {
            energy: energyBalance,
            totalEnergyProduced,
            xp: totalXp,
            level: levelInfo.level,
            totalTaps,
          },
          client
        );

        await createTapEvent({ userId, taps, energyDelta }, client);

        await achievementService.syncMetric(userId, 'total_energy', totalEnergyProduced, client);
        await achievementService.syncMetric(userId, 'total_taps', totalTaps, client);

        const effectiveMultiplier = baseEnergyDelta > 0 ? energyDelta / baseEnergyDelta : 1;

        const payload = {
          taps,
          energy_delta: energyDelta,
          base_energy: baseEnergyDelta,
          effective_multiplier: Number(effectiveMultiplier.toFixed(3)),
          xp_delta: xpDelta,
          latency_ms: latencyMs,
          leveled_up: leveledUp,
        };

        logger.info({ userId, ...payload }, 'tap_batch_processed');

        await logEvent(userId, 'tap_batch_processed', payload, { client });
      });

      return true;
    } finally {
      await redis.del(lockKey).catch(() => {});
    }
  }
}

export const tapAggregator = new TapAggregator(undefined, getRedis);
