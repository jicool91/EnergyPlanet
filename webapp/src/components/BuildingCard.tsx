/**
 * Building Card Component with Unlock Animation
 * Shows individual building with purchase/upgrade options
 * Animates when building is newly unlocked
 */

import React, { memo, useState, useEffect, useRef, useEffectEvent } from 'react';
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
  const [showUnlockAnim, setShowUnlockAnim] = useState(false);
  const [buttonStates, setButtonStates] = useState<ButtonStateType>({
    purchase: { success: false, error: false },
    upgrade: { success: false, error: false },
  });
  const playSound = useSoundEffect();
  const { success, error } = useNotification();
  const { success: hapticSuccess, error: hapticError } = useHaptic();

  const wasLockedRef = useRef(isLocked);

  const startUnlockAnimation = useEffectEvent(() => {
    setShowUnlockAnim(true);
    playSound('unlock');
    hapticSuccess();

    const timer = window.setTimeout(() => {
      setShowUnlockAnim(false);
    }, 1000);

    return () => window.clearTimeout(timer);
  });

  // Detect unlock transition
  useEffect(() => {
    const previouslyLocked = wasLockedRef.current;
    wasLockedRef.current = isLocked;

    if (!previouslyLocked || isLocked) {
      return () => undefined;
    }

    return startUnlockAnimation();
  }, [isLocked]);

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
    } catch {
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
    } catch {
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

  // Design System: Base card styles using 2025 layering
  const baseCardClass =
    'relative flex flex-col gap-md p-md max-[420px]:p-sm-plus max-[360px]:p-sm rounded-2xl border shadow-elevation-2 bg-gradient-to-br from-[rgba(0,26,63,0.95)] to-[rgba(16,19,56,0.92)] backdrop-blur-sm';
  const cardVariant = isBestPayback
    ? 'border-[rgba(0,255,136,0.55)] shadow-glow-lime'
    : 'border-[var(--color-border-subtle)]';
  const lockedClass = isLocked
    ? 'border-[rgba(255,141,77,0.5)] bg-[rgba(26,20,55,0.8)] opacity-80'
    : '';

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
          className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-lime"
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      )}

      {/* Layer 1: Hero */}
      <div className="flex items-start justify-between gap-sm">
        <div className="flex flex-col gap-xs-plus">
          <h3 className="m-0 text-title text-[var(--color-text-primary)] font-bold">
            {building.name}
          </h3>
          <motion.span
            className="inline-flex items-center gap-xs-plus rounded-xl px-sm-plus py-xs-plus bg-[rgba(0,217,255,0.16)] text-label text-[var(--color-text-accent)]"
            animate={showUnlockAnim ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            ×{building.count} юнитов
          </motion.span>
        </div>
        <div className="flex flex-col items-end gap-xs">
          <span className="text-label text-[var(--color-text-secondary)]">LV</span>
          <span className="text-heading font-bold text-[var(--color-text-primary)]">
            {building.level}
          </span>
          {isBestPayback && (
            <span className="mt-xs inline-flex items-center gap-xs-plus rounded-full bg-[rgba(0,255,136,0.15)] px-sm py-xs text-label text-[var(--color-success)] shadow-glow-lime">
              🔥 Лучший ROI
            </span>
          )}
        </div>
      </div>

      {/* Layer 2: Primary metric */}
      <div className="flex flex-col gap-xs">
        <span className="text-label text-[var(--color-text-secondary)] uppercase">Доход</span>
        <span className="text-heading font-bold text-[var(--color-text-primary)]">
          +{formatNumberWithSpaces(Math.round(building.incomePerSec))} E/сек
        </span>
      </div>

      {/* Layer 3: Secondary metrics */}
      <div className="flex flex-wrap items-center gap-sm text-body-sm text-[var(--color-text-secondary)]">
        {roiRank && (
          <span className="font-semibold text-[var(--color-text-primary)]">ROI #{roiRank}</span>
        )}
        <span>Окупаемость: {payback}</span>
        {building.base_income && (
          <span>Базовый доход: {formatNumberWithSpaces(building.base_income)} E</span>
        )}
      </div>

      {/* Layer 4: Next purchase info */}
      <div className="rounded-xl border border-[rgba(0,217,255,0.28)] bg-[rgba(10,19,48,0.75)] px-md py-sm flex flex-col gap-xs">
        <div className="flex items-center justify-between gap-sm">
          <span className="text-label text-[var(--color-text-secondary)] uppercase">
            Следующая покупка
          </span>
          <span className="text-body font-semibold text-[var(--color-text-primary)]">
            {purchaseQuantityLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-sm text-body text-[var(--color-text-secondary)]">
          <span>Стоимость: {purchaseCostLabel}</span>
          {purchasePlan.incomeGain > 0 && (
            <span className="text-[var(--color-success)] font-semibold">
              +{formatNumberWithSpaces(purchasePlan.incomeGain)} E/сек
            </span>
          )}
        </div>
        {!isLocked && purchasePlan.limitedByCap && (
          <div className="rounded-xl border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.12)] px-sm-plus py-xs text-label text-[var(--color-warning)]">
            Достигнут лимит построек для уровня
          </div>
        )}
        {!isLocked && purchasePlan.partial && (
          <div className="rounded-xl border border-[rgba(255,215,0,0.35)] bg-[rgba(255,215,0,0.12)] px-sm-plus py-xs text-label text-[var(--color-warning)]">
            Энергии хватит на ×{purchasePlan.quantity} из {purchasePlan.requestedValue}
          </div>
        )}
        {!isLocked && purchasePlan.insufficientEnergy && (
          <div className="rounded-xl border border-[rgba(255,51,51,0.35)] bg-[rgba(255,51,51,0.12)] px-sm-plus py-xs text-label text-[var(--color-error)]">
            Недостаточно энергии для выбранного пакета
          </div>
        )}
        {isLocked && building.unlock_level && (
          <div className="rounded-xl border border-[rgba(255,141,77,0.32)] bg-[rgba(255,141,77,0.12)] px-sm-plus py-xs text-label text-[var(--color-warning)]">
            Требуется уровень {building.unlock_level}
          </div>
        )}
      </div>

      {/* Layer 5: Actions */}
      <div className="flex flex-col gap-sm sm:flex-row sm:flex-wrap">
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
          className="shadow-glow"
        >
          {isLocked ? 'Недоступно' : `Купить ${purchaseQuantityLabel}`}
        </Button>

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
          className="shadow-elevation-1"
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
