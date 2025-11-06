import { useMemo, useEffect, useRef, useCallback } from 'react';
import { ModalBase } from './ModalBase';
import { Button } from './Button';
import { Panel } from './Panel';
import { ProductTile } from './ProductTile';
import { formatNumberWithSpaces } from '../utils/number';
import { Text } from '@/components/ui/Text';
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
        <Panel tone="overlay" border="subtle" spacing="sm">
          <Text variant="caption" tone="secondary">
            Постоянный бонус от достижений
          </Text>
          <Text variant="title" weight="semibold">
            {achievementMultiplier > 1 ? `+${Math.round((achievementMultiplier - 1) * 100)}%` : '—'}
          </Text>
        </Panel>

        {loading && (
          <div className="grid gap-sm" aria-live="polite">
            <span className="sr-only">Загружаем достижения…</span>
            {[0, 1, 2].map(index => (
              <div
                key={`achievement-skeleton-${index}`}
                className="animate-pulse rounded-2xl border border-tag-accent-border bg-layer-overlay-soft p-md"
              >
                <div className="mb-sm flex items-center gap-sm">
                  <div className="h-10 w-10 rounded-full bg-state-cyan-pill-strong" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-tag-accent-soft" />
                    <div className="h-3 w-1/2 rounded-full bg-state-cyan-pill-glow" />
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-state-cyan-pill-soft" />
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <Panel tone="overlayStrong" border="accent" spacing="sm" className="text-center">
            <Text variant="body" tone="danger">
              {error}
            </Text>
            <Button variant="secondary" onClick={handleRetry}>
              Повторить
            </Button>
          </Panel>
        )}

        {!loading && !error && sorted.length === 0 && (
          <Panel tone="overlay" border="subtle" spacing="sm" className="text-center">
            <Text variant="bodySm" tone="secondary">
              Достижения появятся в следующих обновлениях.
            </Text>
          </Panel>
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
              const unitLabel = item.unit ?? 'ед.';
              const helperText = !tierMeta
                ? 'Все ступени завершены — спасибо за активность!'
                : claimableTier
                  ? 'Нажмите, чтобы моментально получить постоянный бонус.'
                  : `Осталось ${formatNumberWithSpaces(Math.max(0, Math.ceil(remaining)))} ${unitLabel}`;

              return (
                <ProductTile
                  key={item.slug}
                  highlighted={Boolean(claimableTier)}
                  highlightLabel={claimableTier ? 'Готово к получению' : undefined}
                  title={item.name}
                  description={item.description ?? undefined}
                  badge={{
                    label: `Tier ${item.currentTier}/${item.maxTier}`,
                    variant: claimableTier ? 'success' : 'primary',
                  }}
                  media={
                    <Text variant="hero" tone={claimableTier ? 'accent' : 'primary'} aria-hidden>
                      {item.icon ?? '⭐'}
                    </Text>
                  }
                  metrics={[
                    {
                      label: 'Текущий бонус',
                      value: `+${currentBonusPercent}%`,
                      tone: claimableTier ? 'success' : 'accent',
                    },
                    ...(tierMeta
                      ? [
                          {
                            label: claimableTier ? 'Награда' : 'Следующая награда',
                            value: `+${rewardPercent}%`,
                            tone: 'accent' as const,
                          },
                        ]
                      : []),
                  ]}
                  helper={helperText}
                  actions={
                    claimableTier && tierMeta ? (
                      <Button
                        size="sm"
                        variant="primary"
                        loading={isClaiming}
                        onClick={() => handleClaim(item.slug)}
                      >
                        Получить +{rewardPercent}%
                      </Button>
                    ) : null
                  }
                >
                  {!claimableTier && tierMeta ? (
                    <div className="flex flex-col gap-xs">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-state-cyan-pill-strong">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-accent-cyan via-feedback-success to-accent-gold shadow-glow"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between">
                        <Text variant="micro" tone="secondary">
                          {formatNumberWithSpaces(Math.floor(item.progressValue))} {unitLabel}
                        </Text>
                        <Text variant="micro" tone="secondary">
                          Цель: {formatNumberWithSpaces(Math.ceil(targetValue))} {unitLabel}
                        </Text>
                      </div>
                    </div>
                  ) : null}
                </ProductTile>
              );
            })}
          </div>
        )}
      </div>
    </ModalBase>
  );
}
