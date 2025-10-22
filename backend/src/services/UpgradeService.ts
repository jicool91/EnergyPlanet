import { transaction } from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import { contentService } from './ContentService';
import { getProgress, updateProgress } from '../repositories/ProgressRepository';
import {
  getInventoryItem,
  upsertInventoryItem,
} from '../repositories/InventoryRepository';
import { logEvent } from '../repositories/EventRepository';
import { calculateLevelProgress } from '../utils/level';
import { xpFromEnergy } from '../utils/tap';
import { invalidateProfileCache } from '../cache/invalidation';

interface UpgradeRequest {
  buildingId: string;
  action: 'purchase' | 'upgrade';
}

interface UpgradeResponse {
  success: boolean;
  action: 'purchase' | 'upgrade';
  building: {
    building_id: string;
    count: number;
    level: number;
    income_per_sec: number;
    next_cost: number;
    next_upgrade_cost: number;
  };
  energy: number;
  xp_gained: number;
  level: number;
  level_up: boolean;
  xp_to_next_level: number;
}

export class UpgradeService {
  async processUpgrade(userId: string, request: UpgradeRequest): Promise<UpgradeResponse> {
    if (!request.buildingId) {
      throw new AppError(400, 'building_id_required');
    }

    if (request.action !== 'purchase' && request.action !== 'upgrade') {
      throw new AppError(400, 'invalid_upgrade_action');
    }

    const building = contentService.getBuilding(request.buildingId);
    if (!building) {
      throw new AppError(404, 'building_not_found');
    }

    const result = await transaction(async client => {
      const progress = await getProgress(userId, client);
      if (!progress) {
        throw new AppError(404, 'progress_not_found');
      }

      if (!contentService.isBuildingAvailable(building, progress.level)) {
        throw new AppError(400, 'building_locked');
      }

      const existing = await getInventoryItem(userId, request.buildingId, client);
      const playerMax = contentService.getMaxBuildingCount(progress.level);

      if (request.action === 'purchase') {
        const currentCount = existing?.count ?? 0;
        if (building.max_count && currentCount >= building.max_count) {
          throw new AppError(400, 'building_count_cap_reached');
        }
        if (currentCount >= playerMax) {
          throw new AppError(400, 'player_building_cap_reached');
        }

        const cost = contentService.getBuildingCost(building, currentCount);
        if (progress.energy < cost) {
          throw new AppError(400, 'not_enough_energy');
        }

        const updatedInventory = await upsertInventoryItem(userId, request.buildingId, 1, 0, client);
        const xpGained = xpFromEnergy(Math.floor(cost / 2));
        const totalXp = progress.xp + xpGained;
        const levelInfo = calculateLevelProgress(totalXp);
        const leveledUp = levelInfo.level !== progress.level;
        const newEnergy = progress.energy - cost;

        const updatedProgress = await updateProgress(
          userId,
          {
            energy: newEnergy,
            xp: totalXp,
            level: levelInfo.level,
          },
          client
        );

        await logEvent(
          userId,
          'building_purchase',
          {
            building_id: request.buildingId,
            cost,
            new_count: updatedInventory.count,
          },
          { client }
        );

        const income = contentService.getBuildingIncome(building, updatedInventory.count, updatedInventory.level);
        const nextCost = contentService.getBuildingCost(building, updatedInventory.count);
        const nextUpgradeCost = contentService.getBuildingUpgradeCost(building, updatedInventory.level);

        return {
          success: true,
          action: request.action,
          building: {
            building_id: request.buildingId,
            count: updatedInventory.count,
            level: updatedInventory.level,
            income_per_sec: income,
            next_cost: nextCost,
            next_upgrade_cost: nextUpgradeCost,
          },
          energy: updatedProgress.energy,
          xp_gained: xpGained,
          level: updatedProgress.level,
          level_up: leveledUp,
          xp_to_next_level: calculateLevelProgress(updatedProgress.xp).xpToNextLevel,
        };
      }

      if (!existing) {
        throw new AppError(400, 'building_not_owned');
      }

      const cost = contentService.getBuildingUpgradeCost(building, existing.level);
      if (progress.energy < cost) {
        throw new AppError(400, 'not_enough_energy');
      }

      const updatedInventory = await upsertInventoryItem(userId, request.buildingId, 0, 1, client);
      const xpGained = xpFromEnergy(Math.floor(cost / 3));
      const totalXp = progress.xp + xpGained;
      const levelInfo = calculateLevelProgress(totalXp);
      const leveledUp = levelInfo.level !== progress.level;
      const newEnergy = progress.energy - cost;

      const updatedProgress = await updateProgress(
        userId,
        {
          energy: newEnergy,
          xp: totalXp,
          level: levelInfo.level,
        },
        client
      );

      await logEvent(
        userId,
        'building_upgrade',
        {
          building_id: request.buildingId,
          cost,
          new_level: updatedInventory.level,
        },
        { client }
      );

      const income = contentService.getBuildingIncome(building, updatedInventory.count, updatedInventory.level);
      const nextCost = contentService.getBuildingCost(building, updatedInventory.count);
      const nextUpgradeCost = contentService.getBuildingUpgradeCost(building, updatedInventory.level);

      return {
        success: true,
        action: request.action,
        building: {
          building_id: request.buildingId,
          count: updatedInventory.count,
          level: updatedInventory.level,
          income_per_sec: income,
          next_cost: nextCost,
          next_upgrade_cost: nextUpgradeCost,
        },
        energy: updatedProgress.energy,
        xp_gained: xpGained,
        level: updatedProgress.level,
        level_up: leveledUp,
        xp_to_next_level: calculateLevelProgress(updatedProgress.xp).xpToNextLevel,
      };
    });

    await invalidateProfileCache(userId);
    return result;
  }
}
