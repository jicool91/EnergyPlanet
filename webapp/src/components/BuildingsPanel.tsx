import { useMemo, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

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
            const payback = building.payback_seconds
              ? `${Math.round(building.payback_seconds)} сек`
              : '—';
            const roiRank = building.roiRank;

            return (
              <div
                key={building.id}
                className={`flex flex-col gap-3 p-4 rounded-lg bg-[rgba(10,14,32,0.92)] border shadow-[0_18px_40px_rgba(7,12,35,0.35)] ${bestPaybackId === building.id ? 'border-lime/60 shadow-[0_20px_48px_rgba(72,255,173,0.35)] relative after:content-["Лучший_ROI"] after:absolute after:-top-[10px] after:right-4 after:bg-gradient-to-br after:from-lime/90 after:to-cyan/90 after:text-[#04121a] after:text-[11px] after:font-bold after:px-[10px] after:py-1 after:rounded-full after:tracking-[0.5px]' : 'border-cyan/[0.14]'} ${isLocked ? 'border-[rgba(255,196,87,0.45)] bg-[rgba(45,35,18,0.9)]' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="m-0 text-base text-[#f8fbff]">{building.name}</h3>
                  <span className="text-[13px] text-white/70 font-semibold">×{building.count}</span>
                </div>
                <div className="flex gap-4 text-xs text-white/65 flex-wrap">
                  <span>Уровень: {building.level}</span>
                  <span>Доход: {building.incomePerSec.toLocaleString()} /с</span>
                  <span>Окупаемость: {payback}</span>
                  {roiRank && (
                    <span className="text-lime/[0.85] font-semibold">ROI #{roiRank}</span>
                  )}
                </div>
                {isLocked && building.unlock_level && (
                  <div className="text-xs text-[#ffc957]">Требуется уровень {building.unlock_level}</div>
                )}
                <div className="flex gap-3 flex-wrap">
                  <button
                    type="button"
                    className="px-[18px] py-[10px] rounded-md border-0 text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out bg-gradient-to-br from-cyan/25 to-[rgba(38,127,255,0.35)] text-[#f8fbff] disabled:opacity-60 disabled:cursor-default disabled:shadow-none hover:enabled:-translate-y-px hover:enabled:shadow-[0_10px_26px_rgba(0,217,255,0.3)]"
                    onClick={() => purchaseBuilding(building.id)}
                    disabled={processing || !canPurchase}
                  >
                    {processing
                      ? 'Ожидание…'
                      : isLocked
                        ? 'Недоступно'
                        : `Купить (${building.nextCost.toLocaleString()} E)`}
                  </button>
                  <button
                    type="button"
                    className="px-[18px] py-[10px] rounded-md border-0 text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out bg-cyan/[0.12] text-[#f8fbff] disabled:opacity-60 disabled:cursor-default disabled:shadow-none hover:enabled:-translate-y-px hover:enabled:shadow-[0_10px_26px_rgba(0,217,255,0.3)]"
                    onClick={() => upgradeBuilding(building.id)}
                    disabled={processing || !canUpgrade}
                  >
                    {processing ? 'Ожидание…' : `Апгрейд (${building.nextUpgradeCost.toLocaleString()} E)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
