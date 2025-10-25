import { useEffect, useMemo, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { useHaptic } from '../hooks/useHaptic';

interface BoostHubProps {
  showHeader?: boolean;
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

export function BoostHub({ showHeader = true }: BoostHubProps) {
  const {
    boostHub,
    isBoostHubLoading,
    boostHubError,
    isClaimingBoostType,
    loadBoostHub,
    claimBoost,
  } = useGameStore();

  const [now, setNow] = useState(Date.now());

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

  const handleClaimBoost = useCallback(
    async (boostType: string) => {
      try {
        await claimBoost(boostType);
        hapticSuccess();
      } catch (error) {
        hapticError();
        throw error;
      }
    },
    [claimBoost, hapticSuccess, hapticError]
  );

  const items = useMemo(
    () =>
      boostHub.map(item => {
        const cooldownRemaining = Math.max(
          item.cooldown_remaining_seconds - Math.floor((Date.now() - now) / 1000),
          0
        );

        const activeRemaining = item.active
          ? Math.max(item.active.remaining_seconds - Math.floor((Date.now() - now) / 1000), 0)
          : 0;

        return {
          ...item,
          cooldownRemaining,
          activeRemaining,
        };
      }),
    [boostHub, now]
  );

  return (
    <div className="flex flex-col gap-4 p-0 text-token-primary">
      {showHeader ? (
        <div className="relative flex flex-col gap-1">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 className="m-0 text-heading font-semibold">Boost Hub</h2>
              <p className="m-0 text-caption text-token-secondary">
                Активируйте бусты, чтобы ускорить прогресс
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              loading={isBoostHubLoading}
              onClick={() => loadBoostHub(true)}
            >
              Обновить
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="md"
            loading={isBoostHubLoading}
            onClick={() => loadBoostHub(true)}
          >
            Обновить
          </Button>
        </div>
      )}

      {/* Error State */}
      {boostHubError && (
        <Card className="bg-[var(--color-text-destructive)]/10 border-[var(--color-text-destructive)]/40 text-[var(--color-text-destructive)] text-caption">
          {boostHubError}
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {isBoostHubLoading && boostHub.length === 0 ? (
          <div className="p-6 text-center text-token-secondary text-sm">
            Получаем данные о бустах…
          </div>
        ) : (
          items.map(item => {
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
                    : item.boost_type === 'ad_boost'
                      ? 'Получить ×2'
                      : 'Активировать';

            return (
              <Card key={item.boost_type} className="flex flex-col gap-4">
                {/* Title + Multiplier */}
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="m-0 text-body font-semibold">{label}</h3>
                    <p className="m-0 text-caption text-token-secondary">{description}</p>
                  </div>
                  <Badge variant="warning" size="sm">
                    x{item.multiplier}
                  </Badge>
                </div>

                {/* Duration + Cooldown */}
                <div className="flex gap-4 text-caption text-token-secondary">
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
