/**
 * Building Card Component with Unlock Animation
 * Shows individual building with purchase/upgrade options
 * Animates when building is newly unlocked
 */

import React, { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { useNotification } from '@/hooks/useNotification';
import { useHaptic } from '@/hooks/useHaptic';
import { formatNumberWithSpaces } from '@/utils/number';

interface ButtonStateType {
  [key: string]: {
    success: boolean;
    error: boolean;
  };
}

export interface BuildingCardBuilding {
  id: string;
  name: string;
  count: number;
  level: number;
  incomePerSec: number;
  nextCost: number;
  nextUpgradeCost: number;
  roiRank?: number | null;
  unlock_level?: number | null;
  payback_seconds?: number | null;
  base_cost?: number;
  base_income?: number;
  roi_rank?: number | null;
}

export interface BuildingCardProps {
  building: BuildingCardBuilding;
  isLocked: boolean;
  canPurchase: boolean;
  canUpgrade: boolean;
  processing: boolean;
  isBestPayback: boolean;
  purchasePlan: {
    quantity: number;
    requestedLabel: string;
    requestedValue: number;
    totalCost: number;
    incomeGain: number;
    partial: boolean;
    limitedByCap: boolean;
    insufficientEnergy: boolean;
  };
  onPurchase: (buildingId: string, quantity: number) => void;
  onUpgrade: (buildingId: string) => void;
}

/**
 * BuildingCard: Displays a single building with unlock animation
 * Design System: Uses standardized colors, spacing, and typography
 * Shows fade-in + scale-up when building is newly unlocked
 */
const BuildingCardComponent: React.FC<BuildingCardProps> = ({
  building,
  isLocked,
  canPurchase,
  canUpgrade,
  processing,
  isBestPayback,
  purchasePlan,
  onPurchase,
  onUpgrade,
}) => {
  const [wasLocked, setWasLocked] = useState(isLocked);
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const [buttonStates, setButtonStates] = useState<ButtonStateType>({
    purchase: { success: false, error: false },
    upgrade: { success: false, error: false },
  });
  const playSound = useSoundEffect();
  const { success, error } = useNotification();
  const { success: hapticSuccess, error: hapticError } = useHaptic();

  // Detect unlock transition
  useEffect(() => {
    if (wasLocked && !isLocked) {
      // Building just unlocked!
      setShowUnlockAnim(true);
      playSound('unlock');
      hapticSuccess();

      // Stop animation after 1 second
      const timer = setTimeout(() => {
        setShowUnlockAnim(false);
      }, 1000);

      return () => clearTimeout(timer);
    }

    setWasLocked(isLocked);
  }, [isLocked, wasLocked, playSound, hapticSuccess]);

  // Handle purchase with notification and button state
  const handlePurchase = async () => {
    if (purchasePlan.quantity <= 0) {
      setButtonStates(prev => ({ ...prev, purchase: { success: false, error: true } }));
      hapticError();
      error('Недостаточно энергии для выбранного пакета');
      // Reset error state after 1.5s
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, purchase: { success: false, error: false } }));
      }, 1500);
      return;
    }

    try {
      await onPurchase(building.id, purchasePlan.quantity);
      setButtonStates(prev => ({ ...prev, purchase: { success: true, error: false } }));
      hapticSuccess();
      success(`${building.name} ×${purchasePlan.quantity} куплено!`);
      // Reset success state after 1.5s
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, purchase: { success: false, error: false } }));
      }, 1500);
    } catch (err) {
      setButtonStates(prev => ({ ...prev, purchase: { success: false, error: true } }));
      hapticError();
      error(`Ошибка при покупке ${building.name}`);
      // Reset error state after 1.5s
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, purchase: { success: false, error: false } }));
      }, 1500);
    }
  };

  // Handle upgrade with notification and button state
  const handleUpgrade = async () => {
    try {
      await onUpgrade(building.id);
      setButtonStates(prev => ({ ...prev, upgrade: { success: true, error: false } }));
      hapticSuccess();
      success(`${building.name} улучшена!`);
      // Reset success state after 1.5s
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, upgrade: { success: false, error: false } }));
      }, 1500);
    } catch (err) {
      setButtonStates(prev => ({ ...prev, upgrade: { success: false, error: true } }));
      hapticError();
      error(`Ошибка при апгрейде ${building.name}`);
      // Reset error state after 1.5s
      setTimeout(() => {
        setButtonStates(prev => ({ ...prev, upgrade: { success: false, error: false } }));
      }, 1500);
    }
  };

  const payback = building.payback_seconds ? `${Math.round(building.payback_seconds)} сек` : '—';
  const roiRank = building.roiRank;
  const purchaseQuantityLabel =
    purchasePlan.requestedLabel === 'MAX'
      ? `MAX (${purchasePlan.quantity || 0})`
      : purchasePlan.partial
        ? `${purchasePlan.requestedLabel} → ×${purchasePlan.quantity}`
        : `${purchasePlan.requestedLabel}`;
  const purchaseCostLabel =
    purchasePlan.totalCost > 0
      ? `${formatNumberWithSpaces(purchasePlan.totalCost)} E`
      : `${formatNumberWithSpaces(building.nextCost ?? 0)} E`;
  const purchaseDisabled = processing || !canPurchase || purchasePlan.quantity <= 0 || isLocked;

  // Design System: Base card styles using tokens
  const baseCardClass =
    'flex flex-col gap-3 p-4 max-[420px]:p-3 max-[360px]:p-2 rounded-lg border shadow-lg';
  const cardVariant = isBestPayback
    ? 'border-lime/60 bg-dark-secondary/70 shadow-lg relative'
    : 'border-cyan/[0.14] bg-dark-secondary/60';
  const lockedClass = isLocked ? 'border-warning/45 bg-dark-tertiary/50 opacity-70' : '';

  return (
    <motion.div
      key={building.id}
      initial={isLocked ? { opacity: 0.7, scale: 0.98 } : { opacity: 1, scale: 1 }}
      animate={isLocked ? { opacity: 0.7, scale: 0.98 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${baseCardClass} ${cardVariant} ${lockedClass}`}
    >
      {/* Unlock animation pulse */}
      {showUnlockAnim && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none border-2 border-lime"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      )}

      {/* Header: Building name + count */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between max-[420px]:gap-1">
        <h3 className="m-0 text-subheading font-semibold text-token-primary text-base sm:text-subheading max-[360px]:text-sm">
          {building.name}
        </h3>
        <motion.span
          className="text-caption text-[var(--color-text-secondary)] font-semibold"
          animate={showUnlockAnim ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          ×{building.count}
        </motion.span>
      </div>

      {/* Stats: Level, Income, Payback, ROI */}
      <div className="grid gap-2 text-caption text-[var(--color-text-secondary)] sm:flex sm:flex-wrap sm:gap-4 max-[420px]:text-xs max-[360px]:grid-cols-2">
        <span className="font-medium text-token-secondary">Уровень: {building.level}</span>
        <span className="font-medium text-token-secondary">
          Доход: {building.incomePerSec.toLocaleString()} /с
        </span>
        <span>Окупаемость: {payback}</span>
        {roiRank && <span className="text-lime/85 font-semibold">ROI #{roiRank}</span>}
      </div>

      {/* Unlock requirement */}
      {isLocked && building.unlock_level && (
        <div className="text-caption text-warning">Требуется уровень {building.unlock_level}</div>
      )}

      {/* Purchase info: Quantity, Cost, Income gain */}
      <div className="flex flex-col gap-2 text-micro text-[var(--color-text-secondary)] sm:flex-row sm:flex-wrap sm:gap-3 max-[420px]:text-[11px]">
        <span>Пакет: {purchaseQuantityLabel}</span>
        <span>Стоимость: {purchaseCostLabel}</span>
        {purchasePlan.incomeGain > 0 && (
          <span className="text-lime/90">
            +{formatNumberWithSpaces(purchasePlan.incomeGain)} E/с
          </span>
        )}
      </div>

      {/* Purchase warnings */}
      {purchasePlan.partial && !isLocked && (
        <div className="text-micro text-warning">
          Энергии хватит на ×{purchasePlan.quantity} из {purchasePlan.requestedValue}
        </div>
      )}
      {purchasePlan.limitedByCap && !isLocked && (
        <div className="text-micro text-warning">Достигнут лимит построек для уровня</div>
      )}
      {purchasePlan.insufficientEnergy && !isLocked && (
        <div className="text-micro text-red-error">Недостаточно энергии для выбранного пакета</div>
      )}

      {/* Action buttons: Purchase + Upgrade */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
        {/* Purchase button with micro-interactions */}
        <Button
          variant="primary"
          size="md"
          loading={processing}
          loadingText="Ожидание…"
          disabled={purchaseDisabled}
          success={buttonStates.purchase.success}
          error={buttonStates.purchase.error}
          successText="Куплено!"
          onClick={handlePurchase}
        >
          {isLocked ? 'Недоступно' : `Купить ${purchaseQuantityLabel}`}
        </Button>

        {/* Upgrade button with micro-interactions */}
        <Button
          variant="secondary"
          size="md"
          loading={processing}
          loadingText="Ожидание…"
          disabled={processing || !canUpgrade}
          success={buttonStates.upgrade.success}
          error={buttonStates.upgrade.error}
          successText="Апгрейдено!"
          onClick={handleUpgrade}
        >
          Апгрейд
        </Button>
      </div>
    </motion.div>
  );
};

const areBuildingsEqual = (prev: BuildingCardBuilding, next: BuildingCardBuilding) => {
  return (
    prev.id === next.id &&
    prev.name === next.name &&
    prev.count === next.count &&
    prev.level === next.level &&
    prev.incomePerSec === next.incomePerSec &&
    prev.nextCost === next.nextCost &&
    prev.nextUpgradeCost === next.nextUpgradeCost &&
    prev.roiRank === next.roiRank &&
    prev.unlock_level === next.unlock_level &&
    prev.payback_seconds === next.payback_seconds &&
    prev.base_cost === next.base_cost &&
    prev.base_income === next.base_income &&
    prev.roi_rank === next.roi_rank
  );
};

const arePurchasePlansEqual = (
  prev: BuildingCardProps['purchasePlan'],
  next: BuildingCardProps['purchasePlan']
) => {
  return (
    prev.quantity === next.quantity &&
    prev.requestedLabel === next.requestedLabel &&
    prev.requestedValue === next.requestedValue &&
    prev.totalCost === next.totalCost &&
    prev.incomeGain === next.incomeGain &&
    prev.partial === next.partial &&
    prev.limitedByCap === next.limitedByCap &&
    prev.insufficientEnergy === next.insufficientEnergy
  );
};

const arePropsEqual = (prev: BuildingCardProps, next: BuildingCardProps) => {
  return (
    areBuildingsEqual(prev.building, next.building) &&
    prev.isLocked === next.isLocked &&
    prev.canPurchase === next.canPurchase &&
    prev.canUpgrade === next.canUpgrade &&
    prev.processing === next.processing &&
    prev.isBestPayback === next.isBestPayback &&
    arePurchasePlansEqual(prev.purchasePlan, next.purchasePlan) &&
    prev.onPurchase === next.onPurchase &&
    prev.onUpgrade === next.onUpgrade
  );
};

export const BuildingCard = memo(BuildingCardComponent, arePropsEqual);

BuildingCard.displayName = 'BuildingCard';
