import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import clsx from 'clsx';
import { useShallow } from 'zustand/react/shallow';
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
    useShallow(state => ({
      buildings: state.buildings,
      energy: state.energy,
      buildingsError: state.buildingsError,
      isProcessingBuildingId: state.isProcessingBuildingId,
      purchaseBuilding: state.purchaseBuilding,
      upgradeBuilding: state.upgradeBuilding,
    }))
  );
  const { buildingCatalog, loadBuildingCatalog, isBuildingCatalogLoading } = useCatalogStore(
    useShallow(state => ({
      buildingCatalog: state.buildingCatalog,
      loadBuildingCatalog: state.loadBuildingCatalog,
      isBuildingCatalogLoading: state.isBuildingCatalogLoading,
    }))
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
        <div className="flex items-start justify-between gap-sm-plus">
          <div>
            <h2 className="m-0 text-heading text-token-primary">Постройки</h2>
            <p className="m-0 text-caption text-token-secondary">
              Развивайте инфраструктуру и увеличивайте пассивный доход
            </p>
          </div>
          <div className="text-body font-semibold text-token-primary">Энергия: {energyDisplay}</div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div
          className="flex flex-wrap gap-sm"
          role="radiogroup"
          aria-label="Количество построек для покупки"
        >
          {PURCHASE_OPTIONS.map((option, index) => {
            const isActive = option.id === selectedPurchaseId;
            const baseClasses =
              'px-sm-plus py-xs-plus rounded-2xl border text-caption font-semibold transition-all duration-150 focus-ring min-h-[40px] min-w-[72px]';
            return (
              <button
                key={option.id}
                type="button"
                className={clsx(
                  baseClasses,
                  isActive
                    ? 'bg-gradient-to-r from-[rgba(0,217,255,0.28)] via-[rgba(0,255,136,0.24)] to-[rgba(0,217,255,0.28)] border-[rgba(0,255,136,0.55)] text-[var(--color-text-primary)] shadow-glow-lime'
                    : 'bg-[rgba(12,18,40,0.68)] border-[rgba(0,217,255,0.18)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[rgba(0,217,255,0.4)]'
                )}
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
                <span className="flex items-center justify-center gap-xs text-label uppercase tracking-[0.08em]">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        {!showHeader && (
          <div className="text-body font-semibold text-token-primary">Энергия: {energyDisplay}</div>
        )}
      </div>

      {buildingsError && (
        <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,51,51,0.45)] bg-[rgba(58,16,24,0.82)] px-md py-sm-plus text-body text-[var(--color-text-primary)] shadow-elevation-2">
          <span>{buildingsError}</span>
          <button
            onClick={() => loadBuildingCatalog()}
            className="text-xs px-sm py-xs-plus rounded-xl border border-[rgba(255,51,51,0.45)] bg-[rgba(255,51,51,0.16)] text-[var(--color-text-primary)] font-semibold transition-all duration-150 focus-ring hover:bg-[rgba(255,51,51,0.24)]"
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
