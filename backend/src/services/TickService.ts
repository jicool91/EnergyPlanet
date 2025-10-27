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
import {
  ensurePlayerSession,
  updatePlayerSession,
} from '../repositories/PlayerSessionRepository';
import {
  startTickLatencyTimer,
  recordTickSuccess,
  recordTickError,
} from '../metrics/tick';
import { achievementService } from './AchievementService';

const MIN_TICK_SECONDS = 1;

export class TickService {
  async applyTick(userId: string, clientReportedDelta: number) {
    if (Number.isNaN(clientReportedDelta)) {
      throw new AppError(400, 'invalid_time_delta');
    }

    const sanitizedClientDelta = Number.isFinite(clientReportedDelta)
      ? Math.max(0, Math.floor(clientReportedDelta))
      : 0;

    const now = new Date();
    const nowSeconds = Math.floor(now.getTime() / 1000);

    const onlineCapSeconds = Math.max(MIN_TICK_SECONDS, Math.floor(config.session.timeoutMin * 60));
    const offlineCapSeconds = Math.max(
      onlineCapSeconds,
      Math.floor(config.session.maxOfflineHours * 3600)
    );

    const stopLatencyTimer = startTickLatencyTimer();

    try {
      const result = await transaction(async client => {
        const { progress, inventory, boosts } = await loadPlayerContext(userId, client);
        const playerSession = await ensurePlayerSession(userId, client);

      const fallbackBaseline =
        playerSession.lastTickAt ??
        progress.lastLogout ??
        progress.updatedAt ??
        progress.createdAt ??
        null;

      const lastTickSeconds = fallbackBaseline
        ? Math.floor(fallbackBaseline.getTime() / 1000)
        : null;
      const derivedElapsed = lastTickSeconds ? Math.max(0, nowSeconds - lastTickSeconds) : 0;

      const elapsedSeconds =
        lastTickSeconds === null ? Math.max(derivedElapsed, sanitizedClientDelta) : derivedElapsed;

      const availableSeconds = playerSession.pendingPassiveSeconds + elapsedSeconds;
      const accountedSeconds =
        availableSeconds > 0
          ? Math.max(MIN_TICK_SECONDS, Math.min(availableSeconds, offlineCapSeconds))
          : 0;
      const carriedSeconds = Math.max(0, availableSeconds - accountedSeconds);

      const buildingDetails = buildBuildingDetails(inventory, progress.level);
      const passiveIncome = computePassiveIncome(
        buildingDetails,
        boosts,
        progress.prestigeMultiplier,
        progress.achievementMultiplier
      );

      const energyGained = Math.floor(passiveIncome.effectiveIncome * accountedSeconds);
      const xpGained = xpFromEnergy(energyGained);
      const totalEnergyProduced = energyGained
        ? progress.totalEnergyProduced + energyGained
        : progress.totalEnergyProduced;
      const newEnergy = energyGained ? progress.energy + energyGained : progress.energy;
      const totalXp = xpGained ? progress.xp + xpGained : progress.xp;
      const levelInfo = calculateLevelProgress(totalXp);
      const leveledUp = levelInfo.level !== progress.level;

      const updatedProgress =
        energyGained > 0 || xpGained > 0 || leveledUp
          ? await updateProgress(
              userId,
              {
                energy: newEnergy,
                totalEnergyProduced,
                xp: totalXp,
                level: levelInfo.level,
              },
              client
            )
          : progress;

      if (energyGained > 0) {
        await achievementService.syncMetric(userId, 'total_energy', totalEnergyProduced, client);
      }

      await updatePlayerSession(
        userId,
        {
          lastTickAt: now,
          pendingPassiveSeconds: carriedSeconds,
        },
        client
      );

      if (energyGained > 0) {
        await logEvent(
          userId,
          'tick',
          {
            duration_sec: accountedSeconds,
            energy_gained: energyGained,
            xp_gained: xpGained,
            leveled_up: leveledUp,
            carried_over_sec: carriedSeconds,
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
          accountedSeconds,
          carriedSeconds,
          availableSeconds,
          previousLevel: progress.level,
        };
      });

      stopLatencyTimer();
      recordTickSuccess({
        accountedSeconds: result.accountedSeconds,
        carriedSeconds: result.carriedSeconds,
        energyGained: result.energyGained,
      });

      logger.debug('tick_applied', {
        userId,
        duration_sec: result.accountedSeconds,
        available_sec: result.availableSeconds,
        carried_over_sec: result.carriedSeconds,
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
        achievement_multiplier: result.passiveIncome.achievementMultiplier,
        duration_sec: result.accountedSeconds,
        carried_over_sec: result.carriedSeconds,
        pending_passive_sec: result.carriedSeconds,
      };
    } catch (error) {
      stopLatencyTimer();
      const reason =
        error instanceof AppError ? error.message : error instanceof Error ? error.name : 'unknown';
      recordTickError(reason);
      throw error;
    }
  }
}
