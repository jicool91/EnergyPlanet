import { useMemo } from 'react';
import { ModalBase } from './ModalBase';
import { Button } from './Button';
import { formatNumberWithSpaces } from '../utils/number';
import type { AchievementView } from '@/services/achievements';

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

  return (
    <ModalBase
      isOpen={isOpen}
      title="Достижения"
      onClose={onClose}
      size="lg"
      actions={[{ label: 'Закрыть', onClick: onClose, variant: 'secondary' }]}
    >
      <div className="flex flex-col gap-sm-plus">
        <div className="rounded-md bg-[var(--app-card-bg)] border border-[var(--color-border-subtle)] p-sm-plus">
          <p className="text-caption text-[var(--color-text-secondary)]">
            Постоянный бонус от достижений
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            ×{achievementMultiplier.toFixed(2)}
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
            <Button variant="secondary" onClick={onRetry}>
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
              const progressPercent = Math.min(100, Math.round(item.progressRatio * 100));
              const nextThreshold = item.nextThreshold
                ? formatNumberWithSpaces(Math.ceil(item.nextThreshold))
                : null;
              const claimableTier = item.claimableTier;
              const claimableTierMeta = claimableTier
                ? item.tiers.find(tier => tier.tier === claimableTier)
                : null;
              const isClaiming = claimingSlug === item.slug;

              return (
                <div
                  key={item.slug}
                  className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--app-surface)] p-sm-plus flex flex-col gap-xs"
                >
                  <div className="flex items-start justify-between gap-sm">
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
                          Уровень {item.currentTier} / {item.maxTier}
                        </p>
                      </div>
                    </div>
                    {claimableTierMeta && (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={isClaiming}
                        onClick={() => onClaim(item.slug)}
                      >
                        Получить ×{claimableTierMeta.rewardMultiplier.toFixed(2)}
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col gap-xs">
                    <div className="w-full h-2 rounded-full bg-[var(--color-border-subtle)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-accent)]"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-caption text-[var(--color-text-secondary)]">
                      <span>
                        {formatNumberWithSpaces(Math.floor(item.progressValue))} {item.unit}
                      </span>
                      <span>
                        {nextThreshold ? `Следующий: ${nextThreshold} ${item.unit}` : 'Максимум'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-xs text-caption text-[var(--color-text-tertiary)]">
                    {item.tiers.map(tier => (
                      <span
                        key={tier.id}
                        className={`px-xs-plus py-0.5 rounded-sm border ${
                          tier.earned
                            ? 'border-[var(--color-accent)] text-[var(--color-text-primary)]'
                            : tier.claimable
                              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                              : 'border-[var(--color-border-subtle)]'
                        }`}
                      >
                        {tier.tier} · ×{tier.rewardMultiplier.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ModalBase>
  );
}
