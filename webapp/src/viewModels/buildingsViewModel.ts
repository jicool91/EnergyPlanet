import type { BuildingCardBuilding } from '@/components/BuildingCard';
import type { BuildingDefinition } from '@/services/buildings';

const MAX_BULK_ITERATIONS = 5000;

export interface PurchaseOption {
  id: string;
  label: string;
  value: number;
}

export interface BulkPlan {
  quantity: number;
  requestedLabel: string;
  requestedValue: number;
  totalCost: number;
  incomeGain: number;
  partial: boolean;
  limitedByCap: boolean;
  insufficientEnergy: boolean;
}

export type CatalogBuilding = BuildingCardBuilding & {
  base_cost?: number | null;
  base_income?: number | null;
  cost_multiplier?: number | null;
  upgrade_cost_multiplier?: number | null;
  max_count?: number | null;
  unlock_level?: number | null;
  roi_rank?: number | null;
  payback_seconds?: number | null;
};

export interface OwnedBuilding {
  buildingId: string;
  count: number;
  level: number;
  incomePerSec: number;
  nextCost: number;
  nextUpgradeCost: number;
}

export interface BuildingsViewModelInput {
  buildingCatalog: BuildingDefinition[];
  ownedBuildings: OwnedBuilding[];
  purchaseOption: PurchaseOption;
  energy: number;
}

export interface BuildingsViewModel {
  sortedBuildings: CatalogBuilding[];
  purchasePlans: Map<string, BulkPlan>;
  bestPaybackId: string | null;
}

export const calculateBulkPlan = (
  building: CatalogBuilding,
  option: PurchaseOption,
  availableEnergy: number
): BulkPlan => {
  const desired = option.value;
  const baseCost = building.base_cost ?? building.nextCost ?? 0;
  const costMultiplier = building.cost_multiplier ?? 1;
  const maxCount = building.max_count ?? null;
  const baseIncome = building.base_income ?? 0;

  let quantity = 0;
  let totalCost = 0;
  let currentCount = building.count ?? 0;
  let remainingEnergy = availableEnergy;
  let limitedByCap = false;
  const isMax = !Number.isFinite(desired);
  const iterationLimit = Number.isFinite(desired) ? Number(desired) : MAX_BULK_ITERATIONS;

  for (let iteration = 0; iteration < iterationLimit; iteration += 1) {
    if (maxCount && currentCount >= maxCount) {
      limitedByCap = true;
      break;
    }

    const cost = Math.ceil(baseCost * Math.pow(costMultiplier || 1, currentCount));
    if (!Number.isFinite(cost) || cost <= 0 || remainingEnergy < cost) {
      break;
    }

    totalCost += cost;
    remainingEnergy -= cost;
    currentCount += 1;
    quantity += 1;

    if (isMax && iteration >= MAX_BULK_ITERATIONS - 1) {
      break;
    }
  }

  const incomeGain = baseIncome > 0 ? baseIncome * quantity : 0;
  const partial = Number.isFinite(desired) ? quantity < desired : false;

  return {
    quantity,
    requestedLabel: option.label,
    requestedValue: Number.isFinite(desired) ? Number(desired) : quantity,
    totalCost,
    incomeGain,
    partial,
    limitedByCap,
    insufficientEnergy: quantity === 0,
  };
};

export const buildBuildingsViewModel = ({
  buildingCatalog,
  ownedBuildings,
  purchaseOption,
  energy,
}: BuildingsViewModelInput): BuildingsViewModel => {
  const merged: CatalogBuilding[] = buildingCatalog.map(def => {
    const owned = ownedBuildings.find(b => b.buildingId === def.id);

    return {
      ...def,
      count: owned?.count ?? 0,
      level: owned?.level ?? 0,
      incomePerSec: owned?.incomePerSec ?? def.base_income ?? 0,
      nextCost: owned?.nextCost ?? def.base_cost ?? 0,
      nextUpgradeCost: owned?.nextUpgradeCost ?? Math.round((def.base_cost ?? 0) * 5),
      roiRank: def.roi_rank ?? null,
    };
  });

  const sortedBuildings = merged.sort((a, b) => {
    if (a.unlock_level === b.unlock_level) {
      return (a.base_cost ?? 0) - (b.base_cost ?? 0);
    }
    if (a.unlock_level === null) return 1;
    if (b.unlock_level === null) return -1;
    return (a.unlock_level ?? 0) - (b.unlock_level ?? 0);
  });

  const purchasePlans = new Map<string, BulkPlan>();
  let bestPaybackId: string | null = null;
  let bestValue = Number.POSITIVE_INFINITY;

  for (const building of sortedBuildings) {
    const plan = calculateBulkPlan(building, purchaseOption, energy);
    purchasePlans.set(building.id, plan);

    if (building.payback_seconds && building.payback_seconds > 0) {
      if (building.payback_seconds < bestValue) {
        bestPaybackId = building.id;
        bestValue = building.payback_seconds;
      }
    }
  }

  return {
    sortedBuildings,
    purchasePlans,
    bestPaybackId,
  };
};
