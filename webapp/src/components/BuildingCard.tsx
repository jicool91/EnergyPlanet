/**
 * Building Card Component with Unlock Animation
 * Shows individual building with purchase/upgrade options
 * Animates when building is newly unlocked
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { useNotification } from '@/hooks/useNotification';
import { useHaptic } from '@/hooks/useHaptic';
import { formatNumberWithSpaces } from '@/utils/number';

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
export const BuildingCard: React.FC<BuildingCardProps> = ({
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

  // Handle purchase with notification
  const handlePurchase = async () => {
    if (purchasePlan.quantity <= 0) {
      hapticError();
      error('Недостаточно энергии для выбранного пакета');
      return;
    }

    try {
      await onPurchase(building.id, purchasePlan.quantity);
      hapticSuccess();
      success(`${building.name} ×${purchasePlan.quantity} куплено!`);
    } catch (err) {
      hapticError();
      error(`Ошибка при покупке ${building.name}`);
    }
  };

  // Handle upgrade with notification
  const handleUpgrade = async () => {
    try {
      await onUpgrade(building.id);
      hapticSuccess();
      success(`${building.name} улучшена!`);
    } catch (err) {
      hapticError();
      error(`Ошибка при апгрейде ${building.name}`);
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
  const baseCardClass = 'flex flex-col gap-3 p-4 rounded-lg border shadow-lg';
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
      <div className="flex justify-between items-center">
        <h3 className="m-0 text-subheading font-semibold text-white">{building.name}</h3>
        <motion.span
          className="text-caption text-white/70 font-semibold"
          animate={showUnlockAnim ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          ×{building.count}
        </motion.span>
      </div>

      {/* Stats: Level, Income, Payback, ROI */}
      <div className="flex gap-4 text-caption text-white/65 flex-wrap">
        <span>Уровень: {building.level}</span>
        <span>Доход: {building.incomePerSec.toLocaleString()} /с</span>
        <span>Окупаемость: {payback}</span>
        {roiRank && <span className="text-lime/85 font-semibold">ROI #{roiRank}</span>}
      </div>

      {/* Unlock requirement */}
      {isLocked && building.unlock_level && (
        <div className="text-caption text-warning">Требуется уровень {building.unlock_level}</div>
      )}

      {/* Purchase info: Quantity, Cost, Income gain */}
      <div className="flex flex-wrap gap-3 text-micro text-white/55">
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
      <div className="flex gap-3 flex-wrap">
        {/* Purchase button */}
        <motion.div
          whileTap={!purchaseDisabled ? { scale: 0.95 } : {}}
          whileHover={!purchaseDisabled ? { scale: 1.05 } : {}}
        >
          <Button
            variant="primary"
            size="md"
            loading={processing}
            loadingText="Ожидание…"
            disabled={purchaseDisabled}
            onClick={handlePurchase}
          >
            {isLocked ? 'Недоступно' : `Купить ${purchaseQuantityLabel}`}
          </Button>
        </motion.div>

        {/* Upgrade button */}
        <motion.div
          whileTap={!processing && canUpgrade ? { scale: 0.95 } : {}}
          whileHover={!processing && canUpgrade ? { scale: 1.05 } : {}}
        >
          <Button
            variant="secondary"
            size="md"
            loading={processing}
            loadingText="Ожидание…"
            disabled={processing || !canUpgrade}
            onClick={handleUpgrade}
          >
            Апгрейд
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
