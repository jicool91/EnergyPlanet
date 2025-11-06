import { useEffect, useMemo } from 'react';
import { CheckmarkAnimation } from './animations/CheckmarkAnimation';
import { Confetti } from './animations/Confetti';
import { ModalBase } from './ModalBase';
import { Panel } from './Panel';
import { Text } from './ui/Text';
import { Badge } from './Badge';
import { Button } from './Button';
import { useSoundEffect } from '@/hooks/useSoundEffect';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  itemName: string;
  quantity?: number;
  cost?: number;
  onDismiss: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
  variant?: PurchaseSuccessVariant;
  locale?: PurchaseSuccessLocale;
  costCurrency?: string;
  rewards?: PurchaseSuccessReward[];
  supportLink?: PurchaseSuccessSupportLink;
}

type PurchaseSuccessVariant = 'standard' | 'premium' | 'subscription';
type PurchaseSuccessLocale = 'ru' | 'en';

type RewardTone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success';

interface PurchaseSuccessReward {
  label: string;
  value: string;
  icon?: string;
  tone?: RewardTone;
}

interface PurchaseSuccessSupportLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface PurchaseCopy {
  title: string;
  subtitle: string;
  cta: string;
  badge?: string;
  helper?: string;
}

type CopyResolver = (context: { itemName: string; quantity: number }) => PurchaseCopy;

const COPY: Record<PurchaseSuccessLocale, Record<PurchaseSuccessVariant, CopyResolver>> = {
  ru: {
    standard: ({ itemName, quantity }) => ({
      title: 'Покупка оформлена',
      subtitle: quantity > 1 ? `Вы получили ${quantity}× ${itemName}.` : `Вы получили ${itemName}.`,
      cta: 'Продолжить',
      helper: 'Бонус уже начислен на счёт — проверьте обновлённый баланс в магазине.',
    }),
    premium: ({ itemName }) => ({
      title: 'Премиум-пак активирован ✨',
      subtitle: `Премиум бонусы для «${itemName}» уже подключены.`,
      cta: 'К премиум-витрине',
      badge: 'Premium',
      helper: 'Не забудьте активировать эксклюзивные награды и проверить авто-продление.',
    }),
    subscription: ({ itemName }) => ({
      title: 'Подписка активна',
      subtitle: `Подписка «${itemName}» продлена ещё на период.`,
      cta: 'Понял',
      badge: 'Подписка',
      helper: 'Повторное списание произойдёт автоматически — отменить можно в настройках.',
    }),
  },
  en: {
    standard: ({ itemName, quantity }) => ({
      title: 'Purchase Complete',
      subtitle:
        quantity > 1 ? `You received ${quantity}× ${itemName}.` : `You received ${itemName}.`,
      cta: 'Continue',
      helper: 'Your balance is already updated — enjoy the new items!',
    }),
    premium: ({ itemName }) => ({
      title: 'Premium Pack Unlocked ✨',
      subtitle: `All premium perks for “${itemName}” are live.`,
      cta: 'Go to premium shelf',
      badge: 'Premium',
      helper: 'Remember to review exclusive rewards and manage auto-renewal if needed.',
    }),
    subscription: ({ itemName }) => ({
      title: 'Subscription Active',
      subtitle: `“${itemName}” will renew for another period.`,
      cta: 'Got it',
      badge: 'Subscription',
      helper: 'Next charge happens automatically — manage it from Settings.',
    }),
  },
};

function resolveLocale(locale?: PurchaseSuccessLocale): PurchaseSuccessLocale {
  if (!locale) {
    return 'ru';
  }
  return locale === 'en' ? 'en' : 'ru';
}

function resolveVariant(variant?: PurchaseSuccessVariant): PurchaseSuccessVariant {
  if (!variant) {
    return 'standard';
  }
  return variant;
}

function formatCost(cost: number, locale: PurchaseSuccessLocale, currency?: string): string {
  const normalizedCurrency = currency?.toUpperCase();
  const localeKey = locale === 'ru' ? 'ru-RU' : 'en-US';

  if (!normalizedCurrency || normalizedCurrency === 'E' || normalizedCurrency === 'ENERGY') {
    return `${cost.toLocaleString(localeKey)} E`;
  }

  if (normalizedCurrency === 'STARS') {
    return `${cost.toLocaleString(localeKey)} ⭐`;
  }

  try {
    return new Intl.NumberFormat(localeKey, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: normalizedCurrency === 'RUB' ? 0 : 2,
    }).format(cost);
  } catch {
    return `${cost.toLocaleString(localeKey)} ${normalizedCurrency}`;
  }
}

function resolveRewards(
  rewards: PurchaseSuccessReward[] | undefined,
  {
    itemName,
    quantity,
    cost,
    locale,
    currency,
  }: {
    itemName: string;
    quantity: number;
    cost: number | undefined;
    locale: PurchaseSuccessLocale;
    currency?: string;
  }
): PurchaseSuccessReward[] {
  if (rewards && rewards.length > 0) {
    return rewards;
  }

  const localeCopy = locale === 'ru';
  const items: PurchaseSuccessReward[] = [
    {
      label: localeCopy ? 'Товар' : 'Item',
      value: itemName,
      tone: 'primary',
    },
  ];

  if (quantity > 1) {
    items.push({
      label: localeCopy ? 'Количество' : 'Quantity',
      value: `×${quantity}`,
      tone: 'accent',
    });
  }

  if (typeof cost === 'number') {
    items.push({
      label: localeCopy ? 'Списано' : 'Charged',
      value: formatCost(cost, locale, currency),
      tone: 'accent',
    });
  }

  return items;
}

function maybeHandleSupport(link?: PurchaseSuccessSupportLink) {
  if (!link) {
    return;
  }
  if (link.onClick) {
    link.onClick();
    return;
  }
  if (link.href) {
    if (typeof window !== 'undefined') {
      window.open(link.href, '_blank', 'noopener');
    }
  }
}

/**
 * PurchaseSuccessModal: Displays success feedback with animations
 *
 * Features:
 * - Bounce-in modal animation
 * - Animated checkmark (SVG stroke)
 * - Confetti particle effect
 * - Success sound effect
 * - Auto-close after delay
 *
 * Example:
 * <PurchaseSuccessModal
 *   isOpen={true}
 *   itemName="Solar Panel"
 *   quantity={1}
 *   cost={5000}
 *   onDismiss={handleClose}
 * />
 */
export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  isOpen,
  itemName,
  quantity = 1,
  cost,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 2000,
  variant,
  locale,
  costCurrency,
  rewards,
  supportLink,
}) => {
  const playSound = useSoundEffect();
  const resolvedLocale = resolveLocale(locale);
  const resolvedVariant = resolveVariant(variant);

  const copy = useMemo(() => {
    return COPY[resolvedLocale][resolvedVariant]({ itemName, quantity });
  }, [itemName, quantity, resolvedLocale, resolvedVariant]);

  const rewardItems = useMemo(
    () =>
      resolveRewards(rewards, {
        itemName,
        quantity,
        cost,
        locale: resolvedLocale,
        currency: costCurrency,
      }),
    [rewards, itemName, quantity, cost, resolvedLocale, costCurrency]
  );

  // Play success sound and auto-close on mount
  useEffect(() => {
    if (isOpen) {
      playSound('success');

      if (autoClose) {
        const timer = setTimeout(onDismiss, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, playSound, autoClose, autoCloseDuration, onDismiss]);

  return (
    <>
      {isOpen && <Confetti count={32} duration={2.6} />}
      <ModalBase
        isOpen={isOpen}
        title={copy.title}
        onClose={onDismiss}
        showClose={false}
        size="sm"
        actions={[
          {
            label: copy.cta,
            variant: resolvedVariant === 'premium' ? 'primary' : 'success',
            onClick: onDismiss,
          },
        ]}
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <CheckmarkAnimation size={84} color="#00ff88" duration={0.6} />
          <div className="flex flex-col gap-2">
            {copy.badge && (
              <Badge variant={resolvedVariant === 'premium' ? 'legendary' : 'primary'} size="sm">
                {copy.badge}
              </Badge>
            )}
            <Text as="p" variant="bodySm" tone="secondary" className="m-0">
              {copy.subtitle}
            </Text>
          </div>

          <Panel
            tone="overlay"
            border="accent"
            elevation="soft"
            spacing="sm"
            className="w-full text-left"
          >
            {rewardItems.map(reward => (
              <div
                key={`${reward.label}:${reward.value}`}
                className="flex items-start justify-between gap-sm"
              >
                <Text variant="caption" tone="secondary">
                  {reward.icon && (
                    <span aria-hidden="true" className="mr-1">
                      {reward.icon}
                    </span>
                  )}
                  {reward.label}
                </Text>
                <Text variant="bodySm" weight="semibold" tone={reward.tone ?? 'primary'}>
                  {reward.value}
                </Text>
              </div>
            ))}
          </Panel>

          <Text variant="caption" tone="tertiary">
            {copy.helper}
          </Text>

          {supportLink && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => maybeHandleSupport(supportLink)}
            >
              {supportLink.label}
            </Button>
          )}
        </div>
      </ModalBase>
    </>
  );
};
