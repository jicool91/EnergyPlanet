import { transaction } from '../db/connection';
import { getProgress, updateProgress } from '../repositories/ProgressRepository';
import { resetInventory } from '../repositories/InventoryRepository';
import { clearBoostsForUser } from '../repositories/BoostRepository';
import { loadPlayerContext } from './playerContext';
import { AppError } from '../middleware/errorHandler';
import { logEvent } from '../repositories/EventRepository';
import { invalidateProfileCache } from '../cache/invalidation';
import { achievementService } from './AchievementService';

const PRESTIGE_MILESTONE = 1_000_000_000_000; // 1e12
const MIN_PRESTIGE_LEVEL = 50;

export interface PrestigeStatus {
  prestige_level: number;
  prestige_multiplier: number;
  total_energy_produced: number;
  energy_since_prestige: number;
  potential_multiplier_gain: number;
  potential_multiplier_after_prestige: number;
  next_threshold_energy: number;
  energy_to_next_threshold: number;
  can_prestige: boolean;
}

function computePrestigeGain(energySinceSnapshot: number): number {
  if (energySinceSnapshot <= 0) {
    return 0;
  }
  const ratio = energySinceSnapshot / PRESTIGE_MILESTONE;
  if (ratio < 1) {
    return 0;
  }
  const raw = Math.pow(ratio, 1 / 3);
  return Math.floor(raw);
}

function computeNextThreshold(currentEnergySinceSnapshot: number): number {
  const currentGain = computePrestigeGain(currentEnergySinceSnapshot);
  const targetGain = currentGain + 1;
  return PRESTIGE_MILESTONE * Math.pow(Math.max(targetGain, 1), 3);
}

export class PrestigeService {
  async getStatus(userId: string): Promise<PrestigeStatus> {
    const progress = await getProgress(userId);
    if (!progress) {
      throw new AppError(404, 'progress_not_found');
    }

    const energySincePrestige = Math.max(
      0,
      progress.totalEnergyProduced - progress.prestigeEnergySnapshot
    );
    const gain = computePrestigeGain(energySincePrestige);
    const nextThreshold = computeNextThreshold(energySincePrestige);

    return {
      prestige_level: progress.prestigeLevel,
      prestige_multiplier: progress.prestigeMultiplier,
      total_energy_produced: progress.totalEnergyProduced,
      energy_since_prestige: energySincePrestige,
      potential_multiplier_gain: gain,
      potential_multiplier_after_prestige: progress.prestigeMultiplier + gain,
      next_threshold_energy: nextThreshold,
      energy_to_next_threshold: Math.max(0, nextThreshold - energySincePrestige),
      can_prestige: gain >= 1 && progress.level >= MIN_PRESTIGE_LEVEL,
    };
  }

  async performPrestige(userId: string) {
    const result = await transaction(async client => {
      const context = await loadPlayerContext(userId, client);
      const progress = context.progress;

      const energySincePrestige = Math.max(
        0,
        progress.totalEnergyProduced - progress.prestigeEnergySnapshot
      );
      const gain = computePrestigeGain(energySincePrestige);

      if (gain < 1) {
        throw new AppError(400, 'prestige_not_ready');
      }

      if (progress.level < MIN_PRESTIGE_LEVEL) {
        throw new AppError(400, 'prestige_level_requirement_not_met');
      }

      await resetInventory(userId, client);
      await clearBoostsForUser(userId, client);

      const newMultiplier = progress.prestigeMultiplier + gain;
      const now = new Date();

      const updatedProgress = await updateProgress(
        userId,
        {
          level: 1,
          xp: 0,
          energy: 0,
          tapLevel: 1,
          prestigeLevel: progress.prestigeLevel + 1,
          prestigeMultiplier: newMultiplier,
          prestigeEnergySnapshot: progress.totalEnergyProduced,
          prestigeLastReset: now,
        },
        client
      );

      await achievementService.syncMetric(
        userId,
        'prestige_level',
        updatedProgress.prestigeLevel,
        client
      );

      await logEvent(
        userId,
        'prestige_performed',
        {
          previous_level: progress.level,
          previous_multiplier: progress.prestigeMultiplier,
          new_multiplier: newMultiplier,
          gain,
          energy_since_prestige: energySincePrestige,
          total_energy_produced: progress.totalEnergyProduced,
          active_boosts_cleared: context.boosts.length,
        },
        { client }
      );

      return {
        progress: updatedProgress,
        gain,
        previousMultiplier: progress.prestigeMultiplier,
        newMultiplier,
        energySincePrestige,
        boostsCleared: context.boosts.length,
      };
    });

    await invalidateProfileCache(userId);

    return {
      prestige_level: result.progress.prestigeLevel,
      prestige_multiplier: result.newMultiplier,
      gain: result.gain,
      energy_since_prestige: result.energySincePrestige,
      boosts_cleared: result.boostsCleared,
    };
  }
}

export const prestigeService = new PrestigeService();
