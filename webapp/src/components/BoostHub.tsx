import { useEffect, useMemo, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCatalogStore } from '../store/catalogStore';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { useHaptic } from '../hooks/useHaptic';
import { useNotification } from '../hooks/useNotification';
import { describeError } from '../store/storeUtils';
import { logClientEvent } from '@/services/telemetry';

type BoostCategory = 'daily' | 'ad' | 'premium';

interface BoostHubProps {
  showHeader?: boolean;
  filter?: BoostCategory;
}

function formatSeconds(seconds: number): string {
  if (seconds <= 0) {
    return 'Доступно';
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}ч ${mins.toString().padStart(2, '0')}м`;
  }

  if (mins > 0) {
    return `${mins}м ${secs.toString().padStart(2, '0')}с`;
  }

  return `${secs}с`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}ч ${mins}м` : `${hrs}ч`;
  }
  return `${minutes}м`;
}

function resolveBoostLabel(type: string): string {
  switch (type) {
    case 'ad_boost':
      return 'Рекламный буст';
    case 'daily_boost':
      return 'Ежедневный буст';
    case 'premium_boost':
      return 'Премиум буст';
    default:
      return type;
  }
}

function resolveBoostCategory(type: string, requiresPremium?: boolean): BoostCategory {
  if (requiresPremium || type === 'premium_boost') {
    return 'premium';
  }
  if (type === 'ad_boost') {
    return 'ad';
  }
  return 'daily';
}

export function BoostHub({ showHeader = true, filter }: BoostHubProps) {
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

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    loadBoostHub();
  }, [loadBoostHub]);

  useEffect(() => {
    if (boostHub.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [boostHub.length]);

  const { success: hapticSuccess, error: hapticError } = useHaptic();
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotification();

  const handleClaimBoost = useCallback(
    async (boostType: string) => {
      try {
        await claimBoost(boostType);
        hapticSuccess();
        notifySuccess('Буст активирован!');
        void logClientEvent('boost_claim_ui_success', { boost_type: boostType });
      } catch (error) {
        hapticError();
        const { status, message } = describeError(error, 'Не удалось активировать буст');
        if (status === 429) {
          notifyError('Этот буст пока недоступен. Попробуйте позже.');
        } else {
          notifyError(message);
        }
        void logClientEvent(
          'boost_claim_ui_error',
          { boost_type: boostType, status, message },
          'warn'
        );
      }
    },
    [claimBoost, hapticError, hapticSuccess, notifyError, notifySuccess]
  );

  const items = useMemo(() => {
    const currentServerMs = now + (boostHubTimeOffsetMs ?? 0);

    return boostHub.map(item => {
      const availableAtMs = Date.parse(item.available_at);
      const cooldownRemaining = Number.isNaN(availableAtMs)
        ? Math.max(0, item.cooldown_remaining_seconds)
        : Math.max(0, Math.ceil((availableAtMs - currentServerMs) / 1000));

      const expiresAtMs = item.active?.expires_at ? Date.parse(item.active.expires_at) : Number.NaN;
      const activeRemaining = item.active
        ? Number.isNaN(expiresAtMs)
          ? Math.max(0, item.active.remaining_seconds)
          : Math.max(0, Math.ceil((expiresAtMs - currentServerMs) / 1000))
        : 0;

      return {
        ...item,
        cooldownRemaining,
        activeRemaining,
      };
    });
  }, [boostHub, boostHubTimeOffsetMs, now]);

  const filteredItems = useMemo(() => {
    if (!filter) {
      return items;
    }
    return items.filter(
      item => resolveBoostCategory(item.boost_type, item.requires_premium) === filter
    );
  }, [filter, items]);

  return (
    <div className="flex flex-col gap-md text-token-primary">
      {showHeader ? (
        <div className="relative flex flex-col gap-xs">
          <div className="flex items-start justify-between gap-sm-plus">
            <div>
              <h2 className="m-0 text-heading font-semibold">Boost Hub</h2>
              <p className="m-0 text-caption text-token-secondary">
                Активируйте бусты, чтобы ускорить прогресс
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Error State */}
      {boostHubError && (
        <Card className="bg-[var(--color-text-destructive)]/10 border-[var(--color-text-destructive)]/40 text-[var(--color-text-destructive)] text-caption">
          {boostHubError}
        </Card>
      )}

      <div className="flex flex-col gap-md">
        {isBoostHubLoading && filteredItems.length === 0 ? (
          <div className="p-6 text-center text-token-secondary text-sm">
            Получаем данные о бустах…
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="bg-token-surface-tertiary text-token-secondary text-sm">
            В этом разделе пока нет бустов. Загляните позже — обновления не заставят себя ждать.
          </Card>
        ) : (
          filteredItems.map(item => {
            const label = resolveBoostLabel(item.boost_type);
            const description = item.requires_premium
              ? 'Доступно владельцам премиум-подписки'
              : item.boost_type === 'ad_boost'
                ? 'Смотрите рекламу, чтобы получить буст'
                : 'Бесплатный буст с кулдауном';

            const buttonDisabled =
              item.activeRemaining > 0 ||
              item.cooldownRemaining > 0 ||
              isClaimingBoostType === item.boost_type;

            const buttonLabel =
              item.activeRemaining > 0
                ? `Активно — ${formatSeconds(item.activeRemaining)}`
                : item.cooldownRemaining > 0
                  ? `Кулдаун ${formatSeconds(item.cooldownRemaining)}`
                  : isClaimingBoostType === item.boost_type
                    ? 'Активация…'
                    : `Получить ×${item.multiplier.toFixed(1).replace(/\.0$/, '')}`;

            return (
              <Card key={item.boost_type} className="flex flex-col gap-md">
                {/* Title + Multiplier */}
                <div className="flex items-start justify-between gap-sm-plus">
                  <div>
                    <h3 className="m-0 text-body font-semibold">{label}</h3>
                    <p className="m-0 text-caption text-token-secondary">{description}</p>
                    {item.requires_premium && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          notifyWarning(
                            'Премиум подписка в разработке. Оставьте заявку в поддержке, чтобы получить ранний доступ.'
                          )
                        }
                        className="mt-2"
                      >
                        Узнать о премиуме
                      </Button>
                    )}
                  </div>
                  <Badge variant="warning" size="sm">
                    x{item.multiplier}
                  </Badge>
                </div>

                {/* Duration + Cooldown */}
                <div className="flex gap-md text-caption text-token-secondary">
                  <span>Длительность: {formatDuration(item.duration_minutes)}</span>
                  <span>Кулдаун: {formatDuration(item.cooldown_minutes)}</span>
                </div>

                {/* Action Button */}
                <Button
                  variant="primary"
                  size="md"
                  loading={isClaimingBoostType === item.boost_type}
                  onClick={() => handleClaimBoost(item.boost_type)}
                  disabled={buttonDisabled}
                >
                  {buttonLabel}
                </Button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
