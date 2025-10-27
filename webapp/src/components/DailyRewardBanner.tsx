/**
 * Daily Reward Banner Component
 * Synchronised with backend boost data to avoid client-side exploits
 */

import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useDevicePerformance } from '../hooks';
import { useCatalogStore } from '@/store/catalogStore';
import { useNotification } from '@/hooks/useNotification';
import { describeError } from '@/store/storeUtils';

interface DailyRewardBannerProps {
  onClaim?: () => void;
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ];

  return parts.join(':');
};

export const DailyRewardBanner: React.FC<DailyRewardBannerProps> = ({ onClaim }) => {
  const performance = useDevicePerformance();
  const isLowPerformance = performance === 'low';
  const isMediumPerformance = performance === 'medium';
  const prefersReducedMotion = useReducedMotion();
  const { success, error } = useNotification();

  const {
    boostHub,
    isBoostHubLoading,
    boostHubError,
    isClaimingBoostType,
    loadBoostHub,
    claimBoost,
    boostHubTimeOffsetMs,
  } = useCatalogStore(
    useShallow(state => ({
      boostHub: state.boostHub,
      isBoostHubLoading: state.isBoostHubLoading,
      boostHubError: state.boostHubError,
      isClaimingBoostType: state.isClaimingBoostType,
      loadBoostHub: state.loadBoostHub,
      claimBoost: state.claimBoost,
      boostHubTimeOffsetMs: state.boostHubTimeOffsetMs,
    }))
  );

  const [localNow, setLocalNow] = useState(() => Date.now());

  useEffect(() => {
    loadBoostHub();
  }, [loadBoostHub]);

  useEffect(() => {
    const timer = window.setInterval(() => setLocalNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const serverNow = boostHubTimeOffsetMs != null ? localNow + boostHubTimeOffsetMs : localNow;
  const dailyBoost = useMemo(
    () => boostHub.find(item => item.boost_type === 'daily_boost'),
    [boostHub]
  );
  const availableAtMs = dailyBoost?.available_at ? Date.parse(dailyBoost.available_at) : null;
  const remainingToAvailabilityMs =
    availableAtMs != null ? Math.max(availableAtMs - serverNow, 0) : Number.POSITIVE_INFINITY;
  const activeExpiresMs = dailyBoost?.active?.expires_at
    ? Date.parse(dailyBoost.active.expires_at)
    : null;
  const activeRemainingMs = activeExpiresMs != null ? Math.max(activeExpiresMs - serverNow, 0) : 0;
  const hasData = Boolean(dailyBoost);
  const isLoading = isBoostHubLoading && !hasData;
  const isClaiming = isClaimingBoostType === 'daily_boost';
  const isAvailable =
    hasData && remainingToAvailabilityMs <= 0 && (activeRemainingMs <= 0 || !dailyBoost?.active);
  const buttonDisabled = !isAvailable || isClaiming || isLoading;

  const rewardHeadline = useMemo(() => {
    if (!dailyBoost?.multiplier) {
      return 'Ежедневная награда';
    }
    const bonusPercent = Math.round((dailyBoost.multiplier - 1) * 100);
    return bonusPercent > 0
      ? `Ежедневный буст +${bonusPercent}% пассивного дохода`
      : 'Ежедневная награда';
  }, [dailyBoost]);

  const visualCountdown = isAvailable
    ? 'Буст готов — заберите сейчас'
    : activeRemainingMs > 0
      ? `Активно ещё ${formatDuration(activeRemainingMs)}`
      : hasData
        ? `Доступно через ${formatDuration(remainingToAvailabilityMs)}`
        : 'Загружаем…';

  const accessibleStatus = useMemo(() => {
    if (isLoading) {
      return 'Загружаем данные об ежедневной награде';
    }

    if (activeRemainingMs > 0) {
      const seconds = Math.max(Math.ceil(activeRemainingMs / 1000), 0);
      if (seconds >= 60) {
        const minutes = Math.ceil(seconds / 60);
        return `Буст активен ещё ${minutes} мин.`;
      }
      return `Буст активен ещё ${seconds} с.`;
    }

    if (isAvailable) {
      return 'Награда доступна';
    }

    if (!hasData || remainingToAvailabilityMs === Number.POSITIVE_INFINITY) {
      return 'Ожидаем данные о награде';
    }

    const seconds = Math.max(Math.ceil(remainingToAvailabilityMs / 1000), 0);
    if (seconds >= 60) {
      const minutes = Math.ceil(seconds / 60);
      return `Награда будет доступна через ${minutes} мин.`;
    }

    return `Награда будет доступна через ${seconds} с.`;
  }, [activeRemainingMs, hasData, isAvailable, isLoading, remainingToAvailabilityMs]);

  const buttonLabel = isClaiming ? 'Получаем…' : isAvailable ? 'Получить' : 'Недоступно';

  const handleClaim = async () => {
    if (buttonDisabled) {
      return;
    }

    try {
      await claimBoost('daily_boost');
      success('Награда получена! +50% буст активирован');
      onClaim?.();
    } catch (err) {
      const { message } = describeError(err, 'Не удалось получить награду');
      error(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-200/90 via-amber-100/95 to-yellow-100/95 p-4 shadow-lg text-amber-900"
    >
      {!prefersReducedMotion && !isLowPerformance && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-300/35 to-transparent opacity-60"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: isMediumPerformance ? 3.6 : 3,
            repeat: Infinity,
            repeatType: 'loop',
          }}
        />
      )}

      <div className="relative flex flex-wrap items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3 min-w-[220px] flex-1">
          <span
            className={`text-4xl ${isLowPerformance || prefersReducedMotion ? '' : 'animate-bounce'}`}
            role="img"
            aria-label="Подарок ежедневной награды"
          >
            🎁
          </span>
          <div className="flex-1 min-w-[160px]">
            <p className="m-0 text-sm font-bold">{rewardHeadline}</p>
            <p className="m-0 text-xs text-amber-800/80">
              {visualCountdown}
              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {accessibleStatus}
              </span>
            </p>
            {boostHubError && (
              <p className="m-0 mt-1 text-xs text-[var(--color-text-destructive)]" role="status">
                {boostHubError}
              </p>
            )}
          </div>
        </div>

        <motion.button
          whileHover={!buttonDisabled ? { scale: 1.05 } : undefined}
          whileTap={!buttonDisabled ? { scale: 0.95 } : undefined}
          onClick={handleClaim}
          className={`flex-shrink-0 px-4 py-2 rounded-lg bg-amber-500 text-amber-950 font-bold text-sm transition-all duration-200 shadow-md focus-ring ${
            buttonDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-amber-400'
          }`}
          type="button"
          disabled={buttonDisabled}
          aria-disabled={buttonDisabled}
        >
          {buttonLabel}
        </motion.button>
      </div>
    </motion.div>
  );
};
