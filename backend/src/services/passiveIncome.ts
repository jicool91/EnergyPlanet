import { contentService } from './ContentService';
import { InventoryRecord } from '../repositories/InventoryRepository';
import { BoostRecord } from '../repositories/BoostRepository';

export interface BuildingDetail {
  building_id: string;
  name: string;
  count: number;
  level: number;
  income_per_sec: number;
  next_cost: number;
  next_upgrade_cost: number;
}

export interface PassiveIncomeSnapshot {
  baseIncome: number;
  boostMultiplier: number;
  prestigeMultiplier: number;
  achievementMultiplier: number;
  effectiveMultiplier: number;
  effectiveIncome: number;
}

export function buildBuildingDetails(
  inventory: InventoryRecord[],
  playerLevel: number
): BuildingDetail[] {
  return inventory
    .map(item => {
      const building = contentService.getBuilding(item.buildingId);
      if (!building) {
        return null;
      }

      if (!contentService.isBuildingAvailable(building, playerLevel)) {
        return null;
      }

      const incomePerSec = contentService.getBuildingIncome(
        building,
        item.count,
        item.level
      );

      return {
        building_id: item.buildingId,
        name: building.name,
        count: item.count,
        level: item.level,
        income_per_sec: incomePerSec,
        next_cost: contentService.getBuildingCost(building, item.count),
        next_upgrade_cost: contentService.getBuildingUpgradeCost(building, item.level),
      } as BuildingDetail;
    })
    .filter((detail): detail is BuildingDetail => Boolean(detail));
}

export function computePassiveIncome(
  details: BuildingDetail[],
  boosts: BoostRecord[],
  prestigeMultiplier = 1,
  achievementMultiplier = 1
): PassiveIncomeSnapshot {
  const baseIncome = details.reduce((sum, item) => sum + item.income_per_sec, 0);
  const boostMultiplier = boosts.reduce((acc, boost) => acc * boost.multiplier, 1);
  const normalizedPrestige = Math.max(1, prestigeMultiplier);
  const normalizedAchievement = Math.max(1, achievementMultiplier);
  const effectiveMultiplier = boostMultiplier * normalizedPrestige * normalizedAchievement;
  return {
    baseIncome,
    boostMultiplier,
    prestigeMultiplier: normalizedPrestige,
    achievementMultiplier: normalizedAchievement,
    effectiveMultiplier,
    effectiveIncome: baseIncome * effectiveMultiplier,
  };
}
