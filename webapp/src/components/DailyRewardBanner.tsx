/**
 * Daily Reward Banner Component
 * Synchronised with backend boost data to avoid client-side exploits
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useDevicePerformance } from '../hooks';
import { useCatalogStore } from '@/store/catalogStore';
import { useNotification } from '@/hooks/useNotification';
import { describeError } from '@/store/storeUtils';
import { Button } from './Button';
import { Card } from './Card';
import { logClientEvent } from '@/services/telemetry';
import { canShowCap, consumeCap } from '@/utils/frequencyCap';

interface DailyRewardBannerProps {
  onClaim?: () => void;
  onOpenBoosts?: () => void;
  onOpenShop?: (section?: 'star_packs' | 'boosts') => void;
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

export const DailyRewardBanner: React.FC<DailyRewardBannerProps> = ({
  onClaim,
  onOpenBoosts,
  onOpenShop,
}) => {
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
  const [showUpsell, setShowUpsell] = useState(false);
  const hasLoggedUpsellRef = useRef(false);
  const [, setUpsellCapRevision] = useState(0);

  useEffect(() => {
    loadBoostHub();
  }, [loadBoostHub]);

  useEffect(() => {
    const timer = window.setInterval(() => setLocalNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    const refreshCap = () => {
      hasLoggedUpsellRef.current = false;
      setUpsellCapRevision(prev => prev + 1);
    };
    document.addEventListener('visibilitychange', refreshCap);
    window.addEventListener('focus', refreshCap);
    return () => {
      document.removeEventListener('visibilitychange', refreshCap);
      window.removeEventListener('focus', refreshCap);
    };
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
  const dailyUpsellAllowed = canShowCap('daily_reward_upsell', { limit: 2 });

  const isUpsellVisible = showUpsell && dailyUpsellAllowed && isAvailable;

  useEffect(() => {
    if (isUpsellVisible && !hasLoggedUpsellRef.current) {
      hasLoggedUpsellRef.current = true;
      void logClientEvent('daily_boost_upsell_view', {
        source: 'daily_reward_banner',
      });
      return;
    }

    if (!isUpsellVisible) {
      hasLoggedUpsellRef.current = false;
    }
  }, [isUpsellVisible]);

  const handleBoostUpsell = useCallback(() => {
    void logClientEvent('daily_boost_upsell_click', {
      source: 'daily_reward_banner',
      target: 'boosts',
    });
    onOpenBoosts?.();
    setShowUpsell(false);
  }, [onOpenBoosts]);

  const handleShopUpsell = useCallback(() => {
    void logClientEvent('daily_boost_upsell_click', {
      source: 'daily_reward_banner',
      target: 'star_packs',
    });
    onOpenShop?.('star_packs');
    setShowUpsell(false);
  }, [onOpenShop]);

  const handleUpsellDismiss = useCallback(() => {
    void logClientEvent('daily_boost_upsell_dismiss', {
      source: 'daily_reward_banner',
    });
    setShowUpsell(false);
  }, []);

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
      void logClientEvent('daily_boost_claim_success', {
        source: 'daily_reward_banner',
      });
      if (dailyUpsellAllowed) {
        const consumed = consumeCap('daily_reward_upsell', { limit: 2 });
        setUpsellCapRevision(prev => prev + 1);
        if (consumed) {
          setShowUpsell(true);
          hasLoggedUpsellRef.current = false;
        } else {
          setShowUpsell(false);
        }
      } else {
        setShowUpsell(false);
      }
      onClaim?.();
    } catch (err) {
      const { message } = describeError(err, 'Не удалось получить награду');
      error(message);
      void logClientEvent(
        'daily_boost_claim_error',
        {
          source: 'daily_reward_banner',
          message,
        },
        'warn'
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[rgba(0,255,136,0.45)] bg-gradient-to-r from-[rgba(0,217,255,0.22)] via-[rgba(0,255,136,0.18)] to-[rgba(255,215,0,0.25)] p-md shadow-elevation-2 text-[var(--color-text-primary)]"
    >
      {!prefersReducedMotion && !isLowPerformance && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_65%)] opacity-70"
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

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-md min-w-[220px] flex-1">
          <span
            className={`text-4xl ${isLowPerformance || prefersReducedMotion ? '' : 'animate-bounce'}`}
            role="img"
            aria-label="Подарок ежедневной награды"
          >
            🎁
          </span>
          <div className="flex-1 min-w-[160px]">
            <p className="m-0 text-body font-semibold">{rewardHeadline}</p>
            <p className="m-0 text-caption text-[var(--color-text-secondary)]">
              {visualCountdown}
              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {accessibleStatus}
              </span>
            </p>
            {boostHubError && (
              <p
                className="m-0 mt-xs text-caption text-[var(--color-text-destructive)]"
                role="status"
              >
                {boostHubError}
              </p>
            )}
          </div>
        </div>

        <motion.button
          whileHover={!buttonDisabled ? { scale: 1.05 } : undefined}
          whileTap={!buttonDisabled ? { scale: 0.95 } : undefined}
          onClick={handleClaim}
          className={`flex-shrink-0 min-h-[44px] rounded-2xl px-md py-xs-plus bg-gradient-to-r from-[rgba(0,217,255,0.85)] via-[rgba(0,255,136,0.9)] to-[rgba(255,215,0,0.95)] text-[var(--color-surface-primary)] text-caption font-semibold tracking-[0.08em] transition-all duration-200 focus-ring ${
            buttonDisabled ? 'opacity-60 cursor-not-allowed' : 'shadow-glow hover:brightness-105'
          }`}
          type="button"
          disabled={buttonDisabled}
          aria-disabled={buttonDisabled}
        >
          {buttonLabel}
        </motion.button>
      </div>

      {isUpsellVisible && (
        <Card className="mt-sm-plus flex flex-col gap-sm bg-gradient-to-r from-[rgba(120,63,255,0.28)] via-[rgba(42,12,89,0.75)] to-[rgba(0,217,255,0.22)] border-[rgba(120,63,255,0.45)] text-[var(--color-text-primary)]">
          <div>
            <p className="m-0 text-body font-semibold text-[var(--color-text-primary)]">
              Продли ускорение
            </p>
            <p className="m-0 mt-xs text-caption text-[color-mix(in srgb,_var(--color-text-primary)_75%,_transparent)]">
              Активируй премиум буст или докупи Stars, чтобы удержать множитель дольше.
            </p>
          </div>
          <div className="flex flex-wrap gap-sm">
            <Button size="sm" variant="primary" onClick={handleBoostUpsell} className="shadow-glow">
              ⚡ Премиум буст
            </Button>
            <Button size="sm" variant="secondary" onClick={handleShopUpsell}>
              ⭐ Купить Stars
            </Button>
            <Button size="sm" variant="ghost" onClick={handleUpsellDismiss}>
              Позже
            </Button>
          </div>
        </Card>
      )}
    </motion.div>
  );
};
