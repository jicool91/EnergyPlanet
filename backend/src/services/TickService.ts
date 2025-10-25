import { transaction } from '../db/connection';
import { config } from '../config';
import { loadPlayerContext } from './playerContext';
import { buildBuildingDetails, computePassiveIncome } from './passiveIncome';
import { xpFromEnergy } from '../utils/tap';
import { calculateLevelProgress } from '../utils/level';
import { updateProgress } from '../repositories/ProgressRepository';
import { logEvent } from '../repositories/EventRepository';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const MAX_SECONDS_FALLBACK = 3600; // 1 hour safety cap

export class TickService {
  async applyTick(userId: string, timeDeltaSec: number) {
    if (Number.isNaN(timeDeltaSec)) {
      throw new AppError(400, 'invalid_time_delta');
    }

    const normalizedSeconds = Math.max(1, Math.floor(timeDeltaSec));
    const maxAllowed = Math.max(1, config.session.timeoutMin * 60);
    const cappedSeconds = Math.min(normalizedSeconds, Math.min(maxAllowed, MAX_SECONDS_FALLBACK));

    const result = await transaction(async client => {
      const { progress, inventory, boosts } = await loadPlayerContext(userId, client);

      const buildingDetails = buildBuildingDetails(inventory, progress.level);
      const passiveIncome = computePassiveIncome(
        buildingDetails,
        boosts,
        progress.prestigeMultiplier
      );

      const energyGained = Math.floor(passiveIncome.effectiveIncome * cappedSeconds);
      const xpGained = xpFromEnergy(energyGained);
      const totalEnergyProduced = progress.totalEnergyProduced + energyGained;
      const newEnergy = progress.energy + energyGained;
      const totalXp = progress.xp + xpGained;
      const levelInfo = calculateLevelProgress(totalXp);
      const leveledUp = levelInfo.level !== progress.level;

      const updatedProgress = await updateProgress(
        userId,
        {
          energy: newEnergy,
          totalEnergyProduced,
          xp: totalXp,
          level: levelInfo.level,
        },
        client
      );

      if (energyGained > 0) {
        await logEvent(
          userId,
          'tick',
          {
            duration_sec: cappedSeconds,
            energy_gained: energyGained,
            xp_gained: xpGained,
            leveled_up: leveledUp,
          },
          { client }
        );
      }

      return {
        updatedProgress,
        passiveIncome,
        energyGained,
        xpGained,
        leveledUp,
        levelInfo,
        totalXp,
        previousLevel: progress.level,
      };
    });

    logger.debug('tick_applied', {
      userId,
      duration_sec: cappedSeconds,
      passive_income_per_sec: Math.round(result.passiveIncome.effectiveIncome),
      energy_gained: result.energyGained,
      xp_gained: result.xpGained,
      level_before: result.previousLevel,
      level_after: result.updatedProgress.level,
      total_xp: result.totalXp,
      xp_into_level: result.levelInfo.xpIntoLevel,
      xp_to_next_level: result.levelInfo.xpToNextLevel,
    });

    return {
      energy: result.updatedProgress.energy,
      energy_gained: result.energyGained,
      xp_gained: result.xpGained,
      level: result.updatedProgress.level,
      level_up: result.leveledUp,
      xp_into_level: result.levelInfo.xpIntoLevel,
      xp_to_next_level: result.levelInfo.xpToNextLevel,
      passive_income_per_sec: Math.floor(result.passiveIncome.effectiveIncome),
      passive_income_multiplier: result.passiveIncome.effectiveMultiplier,
      boost_multiplier: result.passiveIncome.boostMultiplier,
      prestige_multiplier: result.passiveIncome.prestigeMultiplier,
      duration_sec: cappedSeconds,
    };
  }
}
