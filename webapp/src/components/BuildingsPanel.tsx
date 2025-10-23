import { useMemo, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { BuildingCard } from './BuildingCard';
import { BuildingSkeleton, ErrorBoundary } from './skeletons';

const PURCHASE_OPTIONS = [
  { id: 'x1', label: '×1', value: 1 },
  { id: 'x10', label: '×10', value: 10 },
  { id: 'x100', label: '×100', value: 100 },
  { id: 'max', label: 'MAX', value: Infinity },
] as const;

const MAX_BULK_ITERATIONS = 5000;

type PurchaseOptionId = (typeof PURCHASE_OPTIONS)[number]['id'];

interface BulkPlan {
  quantity: number;
  requestedLabel: string;
  requestedValue: number;
  totalCost: number;
  incomeGain: number;
  partial: boolean;
  limitedByCap: boolean;
  insufficientEnergy: boolean;
}

export function BuildingsPanel() {
  const {
    buildings,
    energy,
    buildingsError,
    isProcessingBuildingId,
    purchaseBuilding,
    upgradeBuilding,
    buildingCatalog,
    loadBuildingCatalog,
    isBuildingCatalogLoading,
  } = useGameStore();
  const playerLevel = useGameStore(state => state.level);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<PurchaseOptionId>('x1');

  const selectedOption = useMemo(
    () => PURCHASE_OPTIONS.find(option => option.id === selectedPurchaseId) ?? PURCHASE_OPTIONS[0],
    [selectedPurchaseId]
  );

  const estimatePlan = useCallback(
    (building: any, option = selectedOption): BulkPlan => {
      const desired = option.value;
      const baseCost = building.base_cost ?? building.nextCost ?? 0;
      const costMultiplier = building.cost_multiplier ?? 1;
      const maxCount = building.max_count ?? null;
      const baseIncome = building.base_income ?? 0;

      let quantity = 0;
      let totalCost = 0;
      let currentCount = building.count ?? 0;
      let remainingEnergy = energy;
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
    },
    [energy, selectedOption]
  );

  useEffect(() => {
    loadBuildingCatalog();
  }, [loadBuildingCatalog]);

  const sortedBuildings = useMemo(() => {
      const merged = buildingCatalog.map(def => {
        const owned = buildings.find(b => b.buildingId === def.id);

        return {
          ...def,
          count: owned?.count ?? 0,
          level: owned?.level ?? 0,
          incomePerSec: owned?.incomePerSec ?? def.base_income,
          nextCost: owned?.nextCost ?? def.base_cost,
          nextUpgradeCost: owned?.nextUpgradeCost ?? Math.round((def.base_cost ?? 0) * 5),
          roiRank: def.roi_rank ?? null,
        };
      });

    return merged.sort((a, b) => {
      if (a.unlock_level === b.unlock_level) {
        return (a.base_cost ?? 0) - (b.base_cost ?? 0);
      }
      if (a.unlock_level === null) return 1;
      if (b.unlock_level === null) return -1;
      return (a.unlock_level ?? 0) - (b.unlock_level ?? 0);
    });
  }, [buildings, buildingCatalog]);

  const bestPaybackId = useMemo(() => {
    let bestId: string | null = null;
    let bestValue = Number.POSITIVE_INFINITY;

    for (const building of sortedBuildings) {
      if (building.payback_seconds && building.payback_seconds > 0) {
        if (building.payback_seconds < bestValue) {
          bestValue = building.payback_seconds;
          bestId = building.id;
        }
      }
    }

    return bestId;
  }, [sortedBuildings]);

  return (
    <div className="flex flex-col gap-4 p-0">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="m-0 text-xl text-[#f8fbff]">Постройки</h2>
          <p className="m-0 text-[13px] text-white/60">Развивайте инфраструктуру и увеличивайте пассивный доход</p>
        </div>
        <div className="text-[13px] text-white/75 font-semibold">Энергия: {Math.floor(energy).toLocaleString()}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PURCHASE_OPTIONS.map(option => {
          const isActive = option.id === selectedPurchaseId;
          return (
            <button
              key={option.id}
              type="button"
              className={`px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-all duration-150 ${
                isActive
                  ? 'border-cyan/60 bg-cyan/20 text-[#f8fbff]'
                  : 'border-cyan/15 bg-dark-secondary/40 text-white/60 hover:text-[#f8fbff]'
              }`}
              onClick={() => setSelectedPurchaseId(option.id)}
              title={
                option.id === 'max'
                  ? 'Покупает столько построек, сколько позволяет энергия и лимиты'
                  : `Пакетная покупка ${option.label}`
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {buildingsError && (
        <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px] flex items-center justify-between">
          <span>{buildingsError}</span>
          <button
            onClick={() => loadBuildingCatalog()}
            className="text-xs px-2 py-1 bg-red-error/20 hover:bg-red-error/30 rounded transition-colors"
          >
            Переload
          </button>
        </div>
      )}

      {isBuildingCatalogLoading && sortedBuildings.length === 0 ? (
        <ErrorBoundary>
          <BuildingSkeleton count={3} />
        </ErrorBoundary>
      ) : sortedBuildings.length === 0 ? (
        <div className="p-4 rounded-[14px] border border-dashed border-cyan/30 text-white/65 text-center">Постройки пока недоступны. Продвигайтесь по уровням, чтобы разблокировать их.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedBuildings.map(building => {
            const isLocked =
              building.unlock_level !== null && building.unlock_level !== undefined
                ? playerLevel < building.unlock_level
                : false;
            const purchasePlan = estimatePlan(building);
            const canPurchase = !isLocked && purchasePlan.quantity > 0;
            const canUpgrade =
              building.count > 0 && building.nextUpgradeCost > 0 && energy >= building.nextUpgradeCost;
            const processing = isProcessingBuildingId === building.id;
            const isBestPayback = bestPaybackId === building.id;

            return (
              <BuildingCard
                key={building.id}
                building={building}
                isLocked={isLocked}
                canPurchase={canPurchase}
                canUpgrade={canUpgrade}
                processing={processing}
                isBestPayback={isBestPayback}
                purchasePlan={purchasePlan}
                onPurchase={(id, quantity) => purchaseBuilding(id, quantity)}
                onUpgrade={upgradeBuilding}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
