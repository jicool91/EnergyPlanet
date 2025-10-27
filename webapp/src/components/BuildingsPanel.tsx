import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore } from '../store/gameStore';
import { useCatalogStore } from '../store/catalogStore';
import { Virtuoso } from 'react-virtuoso';
import { BuildingCard } from './BuildingCard';
import { BuildingSkeleton, ErrorBoundary } from './skeletons';
import { useHaptic } from '../hooks/useHaptic';
import { useSafeArea } from '../hooks';
import { formatCompactNumber } from '../utils/number';
import {
  buildBuildingsViewModel,
  calculateBulkPlan,
  type CatalogBuilding,
  type PurchaseOption,
  type OwnedBuilding,
} from '@/viewModels/buildingsViewModel';
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext';

interface BuildingsPanelProps {
  showHeader?: boolean;
}

const PURCHASE_OPTIONS = [
  { id: 'x1', label: '×1', value: 1 },
  { id: 'x10', label: '×10', value: 10 },
  { id: 'x100', label: '×100', value: 100 },
  { id: 'max', label: 'MAX', value: Infinity },
] as const;

type PurchaseOptionId = (typeof PURCHASE_OPTIONS)[number]['id'];

export function BuildingsPanel({ showHeader = true }: BuildingsPanelProps) {
  const {
    buildings,
    energy,
    buildingsError,
    isProcessingBuildingId,
    purchaseBuilding,
    upgradeBuilding,
  } = useGameStore(
    state => ({
      buildings: state.buildings,
      energy: state.energy,
      buildingsError: state.buildingsError,
      isProcessingBuildingId: state.isProcessingBuildingId,
      purchaseBuilding: state.purchaseBuilding,
      upgradeBuilding: state.upgradeBuilding,
    }),
    shallow
  );
  const { buildingCatalog, loadBuildingCatalog, isBuildingCatalogLoading } = useCatalogStore(
    state => ({
      buildingCatalog: state.buildingCatalog,
      loadBuildingCatalog: state.loadBuildingCatalog,
      isBuildingCatalogLoading: state.isBuildingCatalogLoading,
    }),
    shallow
  );
  const playerLevel = useGameStore(state => state.level);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<PurchaseOptionId>('x1');
  const { safeArea } = useSafeArea();
  const { bottom: contentBottom } = safeArea.content;
  const energyDisplay = useMemo(() => formatCompactNumber(Math.floor(energy)), [energy]);

  const selectedOption: PurchaseOption = useMemo(
    () => PURCHASE_OPTIONS.find(option => option.id === selectedPurchaseId) ?? PURCHASE_OPTIONS[0],
    [selectedPurchaseId]
  );

  useEffect(() => {
    loadBuildingCatalog();
  }, [loadBuildingCatalog]);

  const { success: hapticSuccess, error: hapticError } = useHaptic();

  // Wrapper functions with haptic feedback
  const handlePurchase = useCallback(
    async (buildingId: string, quantity: number) => {
      try {
        await purchaseBuilding(buildingId, quantity);
        hapticSuccess();
      } catch (error) {
        hapticError();
        throw error;
      }
    },
    [purchaseBuilding, hapticSuccess, hapticError]
  );

  const handleUpgrade = useCallback(
    async (buildingId: string) => {
      try {
        await upgradeBuilding(buildingId);
        hapticSuccess();
      } catch (error) {
        hapticError();
        throw error;
      }
    },
    [upgradeBuilding, hapticSuccess, hapticError]
  );

  const ownedBuildings = useMemo<OwnedBuilding[]>(
    () =>
      buildings.map(b => ({
        buildingId: b.buildingId,
        count: b.count,
        level: b.level,
        incomePerSec: b.incomePerSec,
        nextCost: b.nextCost,
        nextUpgradeCost: b.nextUpgradeCost,
      })),
    [buildings]
  );

  const { sortedBuildings, purchasePlans, bestPaybackId } = useMemo(
    () =>
      buildBuildingsViewModel({
        buildingCatalog,
        ownedBuildings,
        purchaseOption: selectedOption,
        energy,
      }),
    [buildingCatalog, ownedBuildings, selectedOption, energy]
  );

  const renderBuildingRow = useCallback(
    (_index: number, building: CatalogBuilding) => {
      const isLocked =
        building.unlock_level !== null && building.unlock_level !== undefined
          ? playerLevel < building.unlock_level
          : false;
      const purchasePlan =
        purchasePlans.get(building.id) ?? calculateBulkPlan(building, selectedOption, energy);
      const canPurchase = !isLocked && purchasePlan.quantity > 0;
      const canUpgrade =
        building.count > 0 && building.nextUpgradeCost > 0 && energy >= building.nextUpgradeCost;
      const processing = isProcessingBuildingId === building.id;
      const isBestPayback = bestPaybackId === building.id;

      return (
        <div className="pb-4" key={building.id}>
          <BuildingCard
            building={building}
            isLocked={isLocked}
            canPurchase={canPurchase}
            canUpgrade={canUpgrade}
            processing={processing}
            isBestPayback={isBestPayback}
            purchasePlan={purchasePlan}
            onPurchase={handlePurchase}
            onUpgrade={handleUpgrade}
          />
        </div>
      );
    },
    [
      bestPaybackId,
      energy,
      handlePurchase,
      handleUpgrade,
      isProcessingBuildingId,
      playerLevel,
      purchasePlans,
      selectedOption,
    ]
  );

  const scrollParent = useContext(ScrollContainerContext);

  const handlePurchaseOptionKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = PURCHASE_OPTIONS.length - 1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          setSelectedPurchaseId(PURCHASE_OPTIONS[nextIndex].id);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = index === 0 ? lastIndex : index - 1;
          setSelectedPurchaseId(PURCHASE_OPTIONS[prevIndex].id);
          break;
        }
        case 'Home':
          event.preventDefault();
          setSelectedPurchaseId(PURCHASE_OPTIONS[0].id);
          break;
        case 'End':
          event.preventDefault();
          setSelectedPurchaseId(PURCHASE_OPTIONS[lastIndex].id);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          setSelectedPurchaseId(PURCHASE_OPTIONS[index].id);
          break;
        default:
          break;
      }
    },
    [setSelectedPurchaseId]
  );

  return (
    <div className="flex flex-col gap-md">
      {showHeader ? (
        <div className="flex justify-between items-start gap-3">
          <div>
            <h2 className="m-0 text-heading text-token-primary">Постройки</h2>
            <p className="m-0 text-caption text-token-secondary">
              Развивайте инфраструктуру и увеличивайте пассивный доход
            </p>
          </div>
          <div className="text-body text-token-primary font-semibold">Энергия: {energyDisplay}</div>
        </div>
      ) : (
        <div className="flex justify-end">
          <div className="text-body text-token-primary font-semibold">Энергия: {energyDisplay}</div>
        </div>
      )}

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Количество построек для покупки"
      >
        {PURCHASE_OPTIONS.map((option, index) => {
          const isActive = option.id === selectedPurchaseId;
          return (
            <button
              key={option.id}
              type="button"
              className={`px-3 py-1.5 rounded-full border text-caption font-semibold transition-all duration-150 ${
                isActive
                  ? 'border-cyan/60 bg-cyan/20 text-token-primary'
                  : 'border-cyan/15 bg-dark-secondary/40 text-token-secondary hover:text-token-primary'
              }`}
              onClick={() => setSelectedPurchaseId(option.id)}
              onKeyDown={event => handlePurchaseOptionKeyDown(event, index)}
              role="radio"
              aria-checked={isActive}
              tabIndex={isActive ? 0 : -1}
              title={
                option.id === 'max'
                  ? 'Покупает столько построек, сколько позволяет энергия и лимиты'
                  : `Пакетная покупка ${option.label}`
              }
              aria-label={
                option.id === 'max'
                  ? 'Максимальная доступная покупка построек'
                  : `Пакетная покупка ${option.label}`
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {buildingsError && (
        <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-body flex items-center justify-between">
          <span>{buildingsError}</span>
          <button
            onClick={() => loadBuildingCatalog()}
            className="text-xs px-2 py-1 bg-red-error/20 hover:bg-red-error/30 rounded transition-colors"
          >
            Перезагрузить
          </button>
        </div>
      )}

      {isBuildingCatalogLoading && sortedBuildings.length === 0 ? (
        <ErrorBoundary>
          <BuildingSkeleton count={3} />
        </ErrorBoundary>
      ) : sortedBuildings.length === 0 ? (
        <div className="p-4 rounded-[14px] border border-dashed border-cyan/30 text-token-secondary text-center">
          Постройки пока недоступны. Продвигайтесь по уровням, чтобы разблокировать их.
        </div>
      ) : (
        <Virtuoso
          className="flex-1"
          data={sortedBuildings}
          itemContent={renderBuildingRow}
          customScrollParent={scrollParent ?? undefined}
          components={{
            Footer: () => <div style={{ height: Math.max(16, Math.max(0, contentBottom) + 24) }} />,
          }}
        />
      )}
    </div>
  );
}
