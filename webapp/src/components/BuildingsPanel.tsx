import { useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { BuildingCard } from './BuildingCard';

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

      {buildingsError && <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px]">{buildingsError}</div>}

      {isBuildingCatalogLoading && sortedBuildings.length === 0 ? (
        <div className="p-4 text-white/65 text-center">Загружаем данные построек…</div>
      ) : sortedBuildings.length === 0 ? (
        <div className="p-4 rounded-[14px] border border-dashed border-cyan/30 text-white/65 text-center">Постройки пока недоступны. Продвигайтесь по уровням, чтобы разблокировать их.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedBuildings.map(building => {
            const isLocked =
              building.unlock_level !== null && building.unlock_level !== undefined
                ? playerLevel < building.unlock_level
                : false;
            const canPurchase = !isLocked && building.nextCost > 0 && energy >= building.nextCost;
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
                onPurchase={purchaseBuilding}
                onUpgrade={upgradeBuilding}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
