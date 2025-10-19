import { transaction } from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import { getProgress, updateProgress } from '../repositories/ProgressRepository';
import { logEvent } from '../repositories/EventRepository';
import { xpFromEnergy, tapEnergyForLevel } from '../utils/tap';
import { calculateLevelProgress } from '../utils/level';
import { getRedis } from '../cache/redis';
import { logger } from '../utils/logger';

const MAX_TAP_COUNT_PER_REQUEST = 50;
const MAX_TAPS_PER_MINUTE = 600;
const MAX_TAPS_PER_SECOND = 30;

function nowEpochSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export class TapService {
  private async enforceRateLimit(userId: string, tapCount: number): Promise<void> {
    try {
      const redis = getRedis();
      const currentSecond = nowEpochSeconds();
      const secondKey = `tap:${userId}:sec:${currentSecond}`;
      const minuteKey = `tap:${userId}:min:${Math.floor(currentSecond / 60)}`;

      const [secondResults, minuteResults] = await Promise.all([
        redis.multi().incrBy(secondKey, tapCount).expire(secondKey, 2).exec(),
        redis.multi().incrBy(minuteKey, tapCount).expire(minuteKey, 120).exec(),
      ]);

      const secondCount = Number(secondResults?.[0] ?? tapCount);
      const minuteCount = Number(minuteResults?.[0] ?? tapCount);

      if (secondCount > MAX_TAPS_PER_SECOND || minuteCount > MAX_TAPS_PER_MINUTE) {
        await logEvent(
          userId,
          'tap_rate_limit',
          {
            tap_count: tapCount,
            second_total: secondCount,
            minute_total: minuteCount,
          },
          { suspicious: true }
        );
        throw new AppError(429, 'tap_rate_limited');
      }
    } catch (error) {
      logger.warn('Tap rate limit degraded, redis unavailable', { error });
    }
  }

  async processTap(userId: string, tapCount: number) {
    if (!Number.isInteger(tapCount) || tapCount <= 0) {
      throw new AppError(400, 'invalid_tap_count');
    }

    if (tapCount > MAX_TAP_COUNT_PER_REQUEST) {
      throw new AppError(400, 'tap_count_too_high');
    }

    await this.enforceRateLimit(userId, tapCount);

    const result = await transaction(async client => {
      const progress = await getProgress(userId, client);
      if (!progress) {
        throw new AppError(404, 'progress_not_found');
      }

      const tapIncomePerHit = tapEnergyForLevel(progress.tapLevel);
      const energyGained = tapIncomePerHit * tapCount;
      const xpGained = xpFromEnergy(energyGained);
      const totalEnergyProduced = progress.totalEnergyProduced + energyGained;
      const newEnergy = progress.energy + energyGained;
      const totalXp = progress.xp + xpGained;
      const levelInfo = calculateLevelProgress(totalXp);
      const leveledUp = levelInfo.level !== progress.level;

      const updated = await updateProgress(
        userId,
        {
          energy: newEnergy,
          totalEnergyProduced,
          xp: totalXp,
          level: levelInfo.level,
        },
        client
      );

      await logEvent(
        userId,
        'tap',
        {
          tap_count: tapCount,
          energy_gained: energyGained,
          xp_gained: xpGained,
          leveled_up: leveledUp,
        },
        { client, suspicious: false }
      );

      return { updated, energyGained, xpGained, leveledUp };
    });

    const levelInfo = calculateLevelProgress(result.updated.xp);

    return {
      energy: result.updated.energy,
      energy_gained: result.energyGained,
      xp_gained: result.xpGained,
      level: result.updated.level,
      xp_into_level: levelInfo.xpIntoLevel,
      xp_to_next_level: levelInfo.xpToNextLevel,
      level_up: result.leveledUp,
    };
  }
}
