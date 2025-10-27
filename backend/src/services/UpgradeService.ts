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
import { calculatePurchaseXp, calculateUpgradeXp } from '../utils/xp';
import { invalidateProfileCache } from '../cache/invalidation';
import { achievementService } from './AchievementService';

interface UpgradeRequest {
  buildingId: string;
  action: 'purchase' | 'upgrade';
  quantity?: number;
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
  xp_into_level: number;
  xp_to_next_level: number;
  purchased?: number;
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

      if (request.action === 'purchase') {
        const rawQuantity = Number(request.quantity ?? 1);
        if (!Number.isFinite(rawQuantity) || rawQuantity <= 0) {
          throw new AppError(400, 'invalid_purchase_quantity');
        }
        const MAX_BULK_PURCHASE = 5000;
        const quantity = Math.min(Math.floor(rawQuantity), MAX_BULK_PURCHASE);
        if (quantity <= 0) {
          throw new AppError(400, 'invalid_purchase_quantity');
        }

        let currentCount = existing?.count ?? 0;
        let currentEnergy = progress.energy;
        let currentXp = progress.xp;
        let currentPlayerLevel = progress.level;
        let lifetimeBuildings = progress.totalBuildingsPurchased;

        let purchased = 0;
        let totalCost = 0;
        let totalRawXp = 0;
        let totalDiminishedXp = 0;
        let totalAppliedXp = 0;
        let lastCap = 0;
        let leveledUp = false;
        let levelInfo = calculateLevelProgress(currentXp);

        while (purchased < quantity) {
          if (building.max_count && currentCount >= building.max_count) {
            throw new AppError(400, 'building_count_cap_reached');
          }

          const playerMaxForLevel = contentService.getMaxBuildingCount(currentPlayerLevel);
          if (currentCount >= playerMaxForLevel) {
            throw new AppError(400, 'player_building_cap_reached');
          }

          const cost = contentService.getBuildingCost(building, currentCount);
          if (currentEnergy < cost) {
            throw new AppError(400, 'not_enough_energy');
          }

          const purchaseXp = calculatePurchaseXp(cost, currentPlayerLevel);
          const nextXpTotal = currentXp + purchaseXp.appliedXp;
          levelInfo = calculateLevelProgress(nextXpTotal);

          if (levelInfo.level !== currentPlayerLevel) {
            leveledUp = true;
          }

          currentEnergy -= cost;
          currentCount += 1;
          currentXp = nextXpTotal;
          currentPlayerLevel = levelInfo.level;
          lifetimeBuildings += 1;

          purchased += 1;
          totalCost += cost;
          totalRawXp += purchaseXp.rawXp;
          totalDiminishedXp += purchaseXp.diminishedXp;
          totalAppliedXp += purchaseXp.appliedXp;
          lastCap = purchaseXp.cap;
        }

        const updatedInventory = await upsertInventoryItem(
          userId,
          request.buildingId,
          purchased,
          0,
          client
        );

        const updatedProgress = await updateProgress(
          userId,
          {
            energy: currentEnergy,
            xp: currentXp,
            level: currentPlayerLevel,
            totalBuildingsPurchased: lifetimeBuildings,
          },
          client
        );

        await achievementService.syncMetric(
          userId,
          'buildings_owned',
          lifetimeBuildings,
          client
        );

        await logEvent(
          userId,
          'building_purchase',
          {
            building_id: request.buildingId,
            quantity: purchased,
            cost: totalCost,
            total_cost: totalCost,
            new_count: updatedInventory.count,
            xp_raw: totalRawXp,
            xp_diminished: totalDiminishedXp,
            xp_applied: totalAppliedXp,
            xp_cap: lastCap,
          },
          { client }
        );

        const income = contentService.getBuildingIncome(
          building,
          updatedInventory.count,
          updatedInventory.level
        );
        const nextCost = contentService.getBuildingCost(building, updatedInventory.count);
        const nextUpgradeCost = contentService.getBuildingUpgradeCost(
          building,
          updatedInventory.level
        );

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
          xp_gained: totalAppliedXp,
          level: updatedProgress.level,
          level_up: leveledUp,
          xp_into_level: levelInfo.xpIntoLevel,
          xp_to_next_level: levelInfo.xpToNextLevel,
          purchased,
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
      const upgradeXp = calculateUpgradeXp(cost, progress.level);
      const totalXp = progress.xp + upgradeXp.appliedXp;
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
          xp_raw: upgradeXp.rawXp,
          xp_diminished: upgradeXp.diminishedXp,
          xp_applied: upgradeXp.appliedXp,
          xp_cap: upgradeXp.cap,
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
        xp_gained: upgradeXp.appliedXp,
        level: updatedProgress.level,
        level_up: leveledUp,
        xp_into_level: levelInfo.xpIntoLevel,
        xp_to_next_level: levelInfo.xpToNextLevel,
      };
    });

    await invalidateProfileCache(userId);
    return result;
  }
}
