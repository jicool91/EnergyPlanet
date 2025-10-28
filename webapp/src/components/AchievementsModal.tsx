import { useMemo, useEffect, useRef, useCallback } from 'react';
import { ModalBase } from './ModalBase';
import { Button } from './Button';
import { formatNumberWithSpaces } from '../utils/number';
import type { AchievementView } from '@/services/achievements';
import { logClientEvent } from '@/services/telemetry';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: AchievementView[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClaim: (slug: string) => void;
  claimingSlug: string | null;
  achievementMultiplier: number;
}

export function AchievementsModal({
  isOpen,
  onClose,
  achievements,
  loading,
  error,
  onRetry,
  onClaim,
  claimingSlug,
  achievementMultiplier,
}: AchievementsModalProps) {
  const hasLoggedViewRef = useRef(false);
  const sorted = useMemo(
    () =>
      [...achievements].sort((a, b) => {
        if (a.claimableTier && !b.claimableTier) {
          return -1;
        }
        if (!a.claimableTier && b.claimableTier) {
          return 1;
        }
        return a.name.localeCompare(b.name, 'ru');
      }),
    [achievements]
  );

  useEffect(() => {
    if (isOpen) {
      if (!hasLoggedViewRef.current) {
        hasLoggedViewRef.current = true;
        void logClientEvent('achievements_modal_view', {
          total: achievements.length,
        });
      }
    } else {
      hasLoggedViewRef.current = false;
    }
  }, [achievements.length, isOpen]);

  const handleClaim = useCallback(
    (slug: string) => {
      void logClientEvent('achievement_claim_click', { slug });
      onClaim(slug);
    },
    [onClaim]
  );

  const handleRetry = useCallback(() => {
    void logClientEvent('achievements_retry_click', {});
    onRetry();
  }, [onRetry]);

  return (
    <ModalBase
      isOpen={isOpen}
      title="Достижения"
      onClose={onClose}
      size="lg"
      showClose={false}
      actions={[{ label: 'Закрыть', onClick: onClose, variant: 'secondary' }]}
    >
      <div className="flex flex-col gap-sm-plus">
        <div className="rounded-md bg-[var(--app-card-bg)] border border-[var(--color-border-subtle)] p-sm-plus">
          <p className="text-caption text-[var(--color-text-secondary)]">
            Постоянный бонус от достижений
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            {achievementMultiplier > 1 ? `+${Math.round((achievementMultiplier - 1) * 100)}%` : '—'}
          </p>
        </div>

        {loading && (
          <div className="py-lg text-center text-body text-[var(--color-text-secondary)]">
            Загружаем достижения...
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col gap-sm text-center">
            <p className="text-body text-[var(--color-text-secondary)]">{error}</p>
            <Button variant="secondary" onClick={handleRetry}>
              Повторить
            </Button>
          </div>
        )}

        {!loading && !error && sorted.length === 0 && (
          <p className="text-body text-[var(--color-text-secondary)]">
            Достижения появятся в следующих обновлениях.
          </p>
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="flex flex-col gap-sm">
            {sorted.map(item => {
              const claimableTier = item.claimableTier;
              const nextTier =
                claimableTier ?? (item.currentTier < item.maxTier ? item.currentTier + 1 : null);
              const tierMeta = nextTier ? item.tiers.find(tier => tier.tier === nextTier) : null;
              const rewardPercent = tierMeta
                ? Math.round((tierMeta.rewardMultiplier - 1) * 100)
                : Math.round((item.claimedMultiplier - 1) * 100);
              const targetValue = tierMeta ? tierMeta.threshold : item.progressValue;
              const progressPercent = tierMeta
                ? Math.min(
                    100,
                    Math.round((item.progressValue / Math.max(tierMeta.threshold, 1)) * 100)
                  )
                : 100;
              const remaining = tierMeta ? Math.max(0, tierMeta.threshold - item.progressValue) : 0;
              const isClaiming = claimingSlug === item.slug;
              const currentBonusPercent = Math.max(
                0,
                Math.round((item.claimedMultiplier - 1) * 100)
              );

              return (
                <div
                  key={item.slug}
                  className="flex flex-col gap-sm rounded-2xl border border-[rgba(0,217,255,0.24)] bg-[rgba(12,18,40,0.82)] p-md shadow-elevation-2"
                >
                  <div className="flex items-start justify-between gap-sm-plus">
                    <div className="flex items-start gap-sm">
                      <div className="text-xl" aria-hidden="true">
                        {item.icon ?? '⭐'}
                      </div>
                      <div>
                        <p className="text-body font-semibold text-[var(--color-text-primary)]">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-caption text-[var(--color-text-secondary)]">
                            {item.description}
                          </p>
                        )}
                        <p className="text-caption text-[var(--color-text-tertiary)] mt-1">
                          {currentBonusPercent > 0
                            ? `Текущий бонус: +${currentBonusPercent}%`
                            : 'Бонус ещё не получен'}
                        </p>
                      </div>
                    </div>
                    {claimableTier && tierMeta && (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={isClaiming}
                        onClick={() => handleClaim(item.slug)}
                      >
                        Получить +{rewardPercent}%
                      </Button>
                    )}
                  </div>

                  {tierMeta ? (
                    <>
                      <div className="rounded-2xl border border-[rgba(0,217,255,0.24)] bg-[rgba(10,16,40,0.72)] px-sm-plus py-sm">
                        {claimableTier ? (
                          <p className="text-caption text-[var(--color-text-primary)] font-medium">
                            Готово к получению: +{rewardPercent}% навсегда
                          </p>
                        ) : (
                          <p className="text-caption text-[var(--color-text-secondary)]">
                            Следующая ступень: +{rewardPercent}% при{' '}
                            {formatNumberWithSpaces(Math.ceil(targetValue))} {item.unit}
                          </p>
                        )}
                      </div>

                      {!claimableTier && (
                        <div className="flex flex-col gap-xs">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(0,217,255,0.18)]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-success)] to-[var(--color-gold)] shadow-glow"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-caption text-[var(--color-text-secondary)]">
                            <span>
                              {formatNumberWithSpaces(Math.floor(item.progressValue))} {item.unit}
                            </span>
                            <span>
                              Осталось {formatNumberWithSpaces(Math.max(0, Math.ceil(remaining)))}{' '}
                              {item.unit}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-caption text-[var(--color-text-secondary)]">
                      Все ступени завершены — спасибо!
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalBase>
  );
}
