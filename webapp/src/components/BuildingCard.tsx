/**
 * Building Card Component with Unlock Animation
 * Shows individual building with purchase/upgrade options
 * Animates when building is newly unlocked
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { useNotification } from '@/hooks/useNotification';
import { useHaptic } from '@/hooks/useHaptic';
import { formatNumberWithSpaces } from '@/utils/number';

interface Building {
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

interface BuildingCardProps {
  building: Building;
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

  const payback = building.payback_seconds
    ? `${Math.round(building.payback_seconds)} сек`
    : '—';
  const roiRank = building.roiRank;
  const purchaseQuantityLabel =
    purchasePlan.requestedLabel === 'MAX'
      ? `MAX (${purchasePlan.quantity || 0})`
      : purchasePlan.partial
        ? `${purchasePlan.requestedLabel} → ×${purchasePlan.quantity}`
        : `${purchasePlan.requestedLabel}`;
  const purchaseCostLabel = purchasePlan.totalCost > 0
    ? `${formatNumberWithSpaces(purchasePlan.totalCost)} E`
    : `${formatNumberWithSpaces(building.nextCost ?? 0)} E`;
  const purchaseDisabled = processing || !canPurchase || purchasePlan.quantity <= 0 || isLocked;

  return (
    <motion.div
      key={building.id}
      initial={isLocked ? { opacity: 0.7, scale: 0.98 } : { opacity: 1, scale: 1 }}
      animate={isLocked ? { opacity: 0.7, scale: 0.98 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col gap-3 p-4 rounded-lg bg-[rgba(10,14,32,0.92)] border shadow-[0_18px_40px_rgba(7,12,35,0.35)] ${
        isBestPayback
          ? 'border-lime/60 shadow-[0_20px_48px_rgba(72,255,173,0.35)] relative after:content-["Лучший_ROI"] after:absolute after:-top-[10px] after:right-4 after:bg-gradient-to-br after:from-lime/90 after:to-cyan/90 after:text-[#04121a] after:text-[11px] after:font-bold after:px-[10px] after:py-1 after:rounded-full after:tracking-[0.5px]'
          : 'border-cyan/[0.14]'
      } ${isLocked ? 'border-[rgba(255,196,87,0.45)] bg-[rgba(45,35,18,0.9)]' : ''}`}
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

      <div className="flex justify-between items-center">
        <h3 className="m-0 text-base text-[#f8fbff]">{building.name}</h3>
        <motion.span
          className="text-[13px] text-white/70 font-semibold"
          animate={showUnlockAnim ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          ×{building.count}
        </motion.span>
      </div>

      <div className="flex gap-4 text-xs text-white/65 flex-wrap">
        <span>Уровень: {building.level}</span>
        <span>Доход: {building.incomePerSec.toLocaleString()} /с</span>
        <span>Окупаемость: {payback}</span>
        {roiRank && <span className="text-lime/[0.85] font-semibold">ROI #{roiRank}</span>}
      </div>

      {isLocked && building.unlock_level && (
        <div className="text-xs text-[#ffc957]">Требуется уровень {building.unlock_level}</div>
      )}

      <div className="flex flex-wrap gap-3 text-[11px] text-white/55">
        <span>Пакет: {purchaseQuantityLabel}</span>
        <span>Стоимость: {purchaseCostLabel}</span>
        {purchasePlan.incomeGain > 0 && (
          <span>+{formatNumberWithSpaces(purchasePlan.incomeGain)} E/с</span>
        )}
      </div>
      {purchasePlan.partial && !isLocked && (
        <div className="text-[11px] text-[#ffd27d]">
          Энергии хватит на ×{purchasePlan.quantity} из {purchasePlan.requestedValue}
        </div>
      )}
      {purchasePlan.limitedByCap && !isLocked && (
        <div className="text-[11px] text-[#ffd27d]">Достигнут лимит построек для уровня</div>
      )}
      {purchasePlan.insufficientEnergy && !isLocked && (
        <div className="text-[11px] text-[#ffb8b8]">Недостаточно энергии для выбранного пакета</div>
      )}

      <div className="flex gap-3 flex-wrap">
        <motion.button
          type="button"
          className="px-[18px] py-[10px] rounded-md border-0 text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out bg-gradient-to-br from-cyan/25 to-[rgba(38,127,255,0.35)] text-[#f8fbff] disabled:opacity-60 disabled:cursor-default disabled:shadow-none hover:enabled:-translate-y-px hover:enabled:shadow-[0_10px_26px_rgba(0,217,255,0.3)]"
          onClick={handlePurchase}
          disabled={purchaseDisabled}
          whileTap={{ scale: 0.95 }}
          whileHover={!purchaseDisabled ? { scale: 1.05 } : {}}
        >
          {processing
            ? 'Ожидание…'
            : isLocked
              ? 'Недоступно'
              : `Купить ${purchaseQuantityLabel} (${purchaseCostLabel})`}
        </motion.button>

        <motion.button
          type="button"
          className="px-[18px] py-[10px] rounded-md border-0 text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out bg-cyan/[0.12] text-[#f8fbff] disabled:opacity-60 disabled:cursor-default disabled:shadow-none hover:enabled:-translate-y-px hover:enabled:shadow-[0_10px_26px_rgba(0,217,255,0.3)]"
          onClick={handleUpgrade}
          disabled={processing || !canUpgrade}
          whileTap={{ scale: 0.95 }}
          whileHover={!processing && canUpgrade ? { scale: 1.05 } : {}}
        >
          {processing ? 'Ожидание…' : `Апгрейд (${building.nextUpgradeCost.toLocaleString()} E)`}
        </motion.button>
      </div>
    </motion.div>
  );
};
