import { AppError } from '../middleware/errorHandler';
import { getProgress } from '../repositories/ProgressRepository';
import { xpFromEnergy, tapEnergyForLevel } from '../utils/tap';
import { calculateLevelProgress } from '../utils/level';
import { getRedis } from '../cache/redis';
import { logger } from '../utils/logger';
import { tapAggregator } from './TapAggregator';
import { logEvent } from '../repositories/EventRepository';
import { getActiveBoosts } from '../repositories/BoostRepository';

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
        const payload = {
          tap_count: tapCount,
          second_total: secondCount,
          minute_total: minuteCount,
        };
        await logEvent(userId, 'tap_rate_limit', payload, { suspicious: true });
        logger.warn({ userId, ...payload }, 'tap_rate_limit_triggered');
        throw new AppError(429, 'tap_rate_limited');
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'tap_rate_limit_degraded'
      );
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

    const progress = await getProgress(userId);
    if (!progress) {
      throw new AppError(404, 'progress_not_found');
    }

    const tapIncomePerHit = tapEnergyForLevel(progress.tapLevel);
    const baseEnergy = tapIncomePerHit * tapCount;

    const activeBoosts = await getActiveBoosts(userId);
    const boostMultiplier = activeBoosts.reduce((acc, boost) => acc * boost.multiplier, 1);
    const prestigeMultiplier = Math.max(1, progress.prestigeMultiplier ?? 1);
    const achievementMultiplier = Math.max(1, progress.achievementMultiplier ?? 1);
    const totalMultiplier = boostMultiplier * prestigeMultiplier * achievementMultiplier;

    const boostedEnergy = Math.round(baseEnergy * totalMultiplier);
    const xpGained = xpFromEnergy(boostedEnergy);

    const bufferTotals = await tapAggregator.bufferTap(userId, {
      taps: tapCount,
      energy: boostedEnergy,
      baseEnergy,
      xp: xpGained,
    });

    const projectedEnergy = progress.energy + bufferTotals.energy;
    const projectedXp = progress.xp + bufferTotals.xp;
    const levelInfo = calculateLevelProgress(projectedXp);
    const leveledUp = levelInfo.level !== progress.level;

    return {
      energy: projectedEnergy,
      energy_gained: boostedEnergy,
      energy_base: baseEnergy,
      xp_gained: xpGained,
      level: levelInfo.level,
      xp_into_level: levelInfo.xpIntoLevel,
      xp_to_next_level: levelInfo.xpToNextLevel,
      level_up: leveledUp,
      boost_multiplier: boostMultiplier,
      prestige_multiplier: prestigeMultiplier,
      achievement_multiplier: achievementMultiplier,
      total_multiplier: totalMultiplier,
    };
  }
}
