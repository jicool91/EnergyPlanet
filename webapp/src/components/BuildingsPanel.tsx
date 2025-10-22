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
    <div className="buildings-panel">
      <div className="buildings-header">
        <div>
          <h2>Постройки</h2>
          <p className="buildings-subtitle">Развивайте инфраструктуру и увеличивайте пассивный доход</p>
        </div>
        <div className="buildings-balance">Энергия: {Math.floor(energy).toLocaleString()}</div>
      </div>

      {buildingsError && <div className="shop-error">{buildingsError}</div>}

      {isBuildingCatalogLoading && sortedBuildings.length === 0 ? (
        <div className="buildings-loader">Загружаем данные построек…</div>
      ) : sortedBuildings.length === 0 ? (
        <div className="buildings-empty">Постройки пока недоступны. Продвигайтесь по уровням, чтобы разблокировать их.</div>
      ) : (
        <div className="buildings-grid">
          {sortedBuildings.map(building => {
            const canPurchase = building.nextCost > 0 && energy >= building.nextCost;
            const canUpgrade = building.nextUpgradeCost > 0 && energy >= building.nextUpgradeCost;
            const processing = isProcessingBuildingId === building.id;
            const payback = building.payback_seconds
              ? `${Math.round(building.payback_seconds)} сек`
              : '—';

            return (
              <div
                key={building.id}
                className={`buildings-card${bestPaybackId === building.id ? ' recommended' : ''}`}
              >
                <div className="buildings-card-header">
                  <h3>{building.name}</h3>
                  <span className="buildings-count">×{building.count}</span>
                </div>
                <div className="buildings-meta">
                  <span>Уровень: {building.level}</span>
                  <span>Доход: {building.incomePerSec.toLocaleString()} /с</span>
                  <span>Окупаемость: {payback}</span>
                </div>
                <div className="buildings-actions">
                  <button
                    type="button"
                    className="buildings-button primary"
                    onClick={() => purchaseBuilding(building.id)}
                    disabled={processing || !canPurchase}
                  >
                    {processing ? 'Ожидание…' : `Купить (${building.nextCost.toLocaleString()} E)`}
                  </button>
                  <button
                    type="button"
                    className="buildings-button secondary"
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
