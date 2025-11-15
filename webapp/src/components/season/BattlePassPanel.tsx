import clsx from 'clsx';
import { memo, useMemo } from 'react';
import { Surface, Text, Button, ProgressBar } from '@/components';

export interface BattlePassRewardView {
  type: string;
  amount?: number;
  itemId?: string | null;
}

export interface BattlePassTierView {
  tier: number;
  requiredXp: number;
  freeRewards: BattlePassRewardView[];
  premiumRewards: BattlePassRewardView[];
  freeClaimed: boolean;
  premiumClaimed: boolean;
  freeClaimable: boolean;
  premiumClaimable: boolean;
}

export interface BattlePassViewModel {
  enabled: boolean;
  premiumPurchased: boolean;
  premiumPriceStars: number;
  totalTiers: number;
  xpPerTier: number;
  currentTier: number;
  xpIntoCurrentTier: number;
  xpToNextTier: number | null;
  nextTierXp: number | null;
  tiers: BattlePassTierView[];
}

export interface BattlePassPanelProps {
  battlePass: BattlePassViewModel;
  onPurchase: () => void | Promise<void>;
  onClaim: (tier: number, track: 'free' | 'premium') => void | Promise<void>;
  purchaseLoading?: boolean;
  claimingKey?: string | null;
}

const REWARD_LABELS: Record<string, string> = {
  energy: 'Энергия',
  stars: 'Stars',
  cosmetic: 'Косметика',
};

function renderReward(reward: BattlePassRewardView) {
  const baseLabel = REWARD_LABELS[reward.type] ?? reward.type;
  if (reward.type === 'cosmetic') {
    return reward.itemId ?? baseLabel;
  }
  if (typeof reward.amount === 'number') {
    return `${reward.amount.toLocaleString('ru-RU')} ${baseLabel}`;
  }
  return baseLabel;
}

function getClaimLabel(
  claimable: boolean,
  claimed: boolean,
  track: 'free' | 'premium',
  premiumPurchased: boolean
) {
  if (claimed) {
    return 'Получено';
  }
  if (!premiumPurchased && track === 'premium') {
    return 'Премиум заблокирован';
  }
  return claimable ? 'Забрать' : 'Недоступно';
}

export const BattlePassPanel = memo(function BattlePassPanel({
  battlePass,
  onPurchase,
  onClaim,
  purchaseLoading = false,
  claimingKey = null,
}: BattlePassPanelProps) {
  const progressPercent = useMemo(() => {
    if (!battlePass.xpToNextTier || battlePass.xpPerTier === 0) {
      return 100;
    }
    return Math.min(100, Math.round((battlePass.xpIntoCurrentTier / battlePass.xpPerTier) * 100));
  }, [battlePass.xpIntoCurrentTier, battlePass.xpPerTier, battlePass.xpToNextTier]);

  const visibleTiers = battlePass.tiers.slice(0, 5);

  return (
    <Surface
      tone="secondary"
      border="subtle"
      elevation="soft"
      padding="lg"
      rounded="3xl"
      className="flex flex-col gap-5"
    >
      <header className="flex flex-col gap-2">
        <Text variant="title" weight="semibold">
          Боевой пропуск
        </Text>
        <Text variant="body" tone="secondary">
          {battlePass.premiumPurchased
            ? 'Премиум-уровень активирован — награды доступны сразу после достижения тира.'
            : 'Получайте награды за каждую ступень и откройте премиум, чтобы забирать двойные бонусы.'}
        </Text>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-border-layer bg-layer-overlay-ghost-soft p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text variant="bodySm" tone="secondary">
              Текущий прогресс
            </Text>
            <Text variant="heading" weight="semibold">
              Тир {battlePass.currentTier} из {battlePass.totalTiers}
            </Text>
          </div>
          {battlePass.premiumPurchased ? (
            <div className="rounded-full bg-state-cyan-pill px-4 py-2 text-bodySm font-semibold text-text-primary">
              Премиум активен
            </div>
          ) : (
            <Button variant="primary" size="md" onClick={onPurchase} loading={purchaseLoading}>
              {battlePass.premiumPriceStars > 0
                ? `Открыть за ${battlePass.premiumPriceStars} Stars`
                : 'Открыть бесплатно'}
            </Button>
          )}
        </div>
        <ProgressBar value={progressPercent} />
        <div className="text-caption text-text-secondary">
          {battlePass.xpToNextTier === null
            ? 'Достигнут максимальный тир'
            : `Осталось ${battlePass.xpToNextTier.toLocaleString('ru-RU')} XP до следующего тира`}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visibleTiers.map(tier => {
          const freeKey = `${tier.tier}-free`;
          const premiumKey = `${tier.tier}-premium`;
          return (
            <div
              key={tier.tier}
              className={clsx(
                'rounded-3xl border border-border-layer bg-layer-overlay-ghost-soft p-4 transition-colors',
                tier.freeClaimable || tier.premiumClaimable
                  ? 'border-accent-gold shadow-glow'
                  : undefined
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Text variant="body" weight="semibold">
                    Тир {tier.tier}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    Требуется {tier.requiredXp.toLocaleString('ru-RU')} XP
                  </Text>
                </div>
                <Text variant="caption" tone="tertiary">
                  Показываем первые 5 тиров
                </Text>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(['free', 'premium'] as const).map(track => {
                  const isPremiumTrack = track === 'premium';
                  const rewards = isPremiumTrack ? tier.premiumRewards : tier.freeRewards;
                  const claimable = isPremiumTrack ? tier.premiumClaimable : tier.freeClaimable;
                  const claimed = isPremiumTrack ? tier.premiumClaimed : tier.freeClaimed;
                  const buttonKey = isPremiumTrack ? premiumKey : freeKey;
                  return (
                    <Surface
                      key={track}
                      tone="overlay"
                      border="subtle"
                      elevation="none"
                      padding="lg"
                      rounded="2xl"
                      className="flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <Text
                          variant="bodySm"
                          tone="secondary"
                          className="uppercase tracking-[0.08em]"
                        >
                          {isPremiumTrack ? 'Премиум' : 'Бесплатно'}
                        </Text>
                        <span aria-hidden="true">{isPremiumTrack ? '💎' : '🎁'}</span>
                      </div>
                      {rewards.length === 0 ? (
                        <Text variant="bodySm" tone="tertiary">
                          Наград нет
                        </Text>
                      ) : (
                        <ul className="list-disc pl-5 text-bodySm text-text-primary">
                          {rewards.map((reward, index) => (
                            <li key={index}>{renderReward(reward)}</li>
                          ))}
                        </ul>
                      )}
                      <Button
                        size="sm"
                        variant={claimable ? 'primary' : 'secondary'}
                        disabled={
                          claimed ||
                          rewards.length === 0 ||
                          (isPremiumTrack && !battlePass.premiumPurchased)
                        }
                        loading={claimingKey === buttonKey}
                        onClick={() => onClaim(tier.tier, track)}
                      >
                        {getClaimLabel(claimable, claimed, track, battlePass.premiumPurchased)}
                      </Button>
                    </Surface>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Surface>
  );
});
