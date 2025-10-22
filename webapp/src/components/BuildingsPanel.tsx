import { useMemo } from 'react';
import { useGameStore } from '../store/gameStore';

export function BuildingsPanel() {
  const {
    buildings,
    energy,
    buildingsError,
    isProcessingBuildingId,
    purchaseBuilding,
    upgradeBuilding,
  } = useGameStore();

  const sortedBuildings = useMemo(
    () =>
      [...buildings].sort((a, b) => {
        if (a.count === b.count) {
          return a.name.localeCompare(b.name);
        }
        return b.count - a.count;
      }),
    [buildings]
  );

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

      {sortedBuildings.length === 0 ? (
        <div className="buildings-empty">Постройки ещё не открыты. Продолжайте играть, чтобы разблокировать их.</div>
      ) : (
        <div className="buildings-grid">
          {sortedBuildings.map(building => {
            const canPurchase = building.nextCost > 0 && energy >= building.nextCost;
            const canUpgrade = building.nextUpgradeCost > 0 && energy >= building.nextUpgradeCost;
            const processing = isProcessingBuildingId === building.buildingId;

            return (
              <div key={building.buildingId} className="buildings-card">
                <div className="buildings-card-header">
                  <h3>{building.name}</h3>
                  <span className="buildings-count">×{building.count}</span>
                </div>
                <div className="buildings-meta">
                  <span>Уровень: {building.level}</span>
                  <span>Доход: {building.incomePerSec.toLocaleString()} /с</span>
                </div>
                <div className="buildings-actions">
                  <button
                    type="button"
                    className="buildings-button primary"
                    onClick={() => purchaseBuilding(building.buildingId)}
                    disabled={processing || !canPurchase}
                  >
                    {processing ? 'Ожидание…' : `Купить (${building.nextCost.toLocaleString()} E)`}
                  </button>
                  <button
                    type="button"
                    className="buildings-button secondary"
                    onClick={() => upgradeBuilding(building.buildingId)}
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
