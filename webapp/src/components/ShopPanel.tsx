import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';
import clsx from 'clsx';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCatalogStore } from '../store/catalogStore';
import { buildShopViewModel } from '@/viewModels/shopViewModel';
import { ShopSkeleton, ErrorBoundary } from './skeletons';
import { Button } from './Button';
import { Card } from './Card';
import { OptimizedImage } from './OptimizedImage';
import { ProductTile, type ProductMetric } from './ProductTile';
import { Text } from './ui/Text';
import { Surface } from './ui/Surface';
import { useHaptic } from '../hooks/useHaptic';
import { useNotification } from '../hooks/useNotification';
import { describeError } from '../store/storeUtils';
import { PurchaseSuccessModal } from './PurchaseSuccessModal';
import { BoostHub } from './BoostHub';
import { ShopSectionLayout } from './ShopSectionLayout';
import type { StarPack } from '@/services/starPacks';
import { logClientEvent } from '@/services/telemetry';

interface ShopPanelProps {
  activeSection?: ShopSection;
  bare?: boolean;
}

export type ShopSection = 'star_packs' | 'cosmetics' | 'boosts';
type StarPackSubSection = 'subscriptions' | 'one_time' | 'bundles';

type PurchaseSuccessModalProps = ComponentProps<typeof PurchaseSuccessModal>;
type SuccessVariant = NonNullable<PurchaseSuccessModalProps['variant']>;
type SuccessLocale = NonNullable<PurchaseSuccessModalProps['locale']>;
type SuccessReward = NonNullable<PurchaseSuccessModalProps['rewards']>[number];
type SuccessSupportLink = PurchaseSuccessModalProps['supportLink'];

interface PurchaseSuccessState {
  itemName: string;
  quantity: number;
  cost?: number;
  costCurrency?: string;
  variant: SuccessVariant;
  locale: SuccessLocale;
  rewards?: SuccessReward[];
  supportLink?: SuccessSupportLink;
}

const resolveLocaleFromNavigator = (): SuccessLocale => {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language?.toLowerCase() ?? '';
    if (lang.startsWith('en')) {
      return 'en';
    }
  }
  return 'ru';
};

const resolvePackCost = (pack: StarPack): { cost?: number; currency?: string } => {
  if (typeof pack.price_rub === 'number') {
    return { cost: pack.price_rub, currency: 'RUB' };
  }
  if (typeof pack.price_usd === 'number') {
    return { cost: pack.price_usd, currency: 'USD' };
  }
  const totalStars = pack.stars + (pack.bonus_stars ?? 0);
  return totalStars > 0 ? { cost: totalStars, currency: 'STARS' } : {};
};

const resolvePackVariant = (
  pack: StarPack,
  section: ShopSection,
  starPackSection: StarPackSubSection
): SuccessVariant => {
  if (section === 'star_packs') {
    if (starPackSection === 'subscriptions') {
      return 'subscription';
    }
    if (starPackSection === 'bundles' || pack.featured || (pack.bonus_stars ?? 0) > 0) {
      return 'premium';
    }
  }
  return 'standard';
};

const buildRewardItems = (
  pack: StarPack,
  locale: SuccessLocale,
  variant: SuccessVariant
): SuccessReward[] => {
  const localeKey = locale === 'ru' ? 'ru-RU' : 'en-US';
  const numberFormatter = new Intl.NumberFormat(localeKey);
  const rewards: SuccessReward[] = [
    {
      label: locale === 'ru' ? 'Товар' : 'Item',
      value: pack.title ?? 'Star Pack',
      tone: 'primary',
    },
    {
      label: locale === 'ru' ? 'Stars' : 'Stars',
      value: `${numberFormatter.format(pack.stars)} ⭐`,
      icon: '⭐',
      tone: 'accent',
    },
  ];

  if ((pack.bonus_stars ?? 0) > 0) {
    rewards.push({
      label: locale === 'ru' ? 'Бонус' : 'Bonus',
      value: `+${numberFormatter.format(pack.bonus_stars ?? 0)} ⭐`,
      icon: '🎁',
      tone: 'success',
    });
  }

  const { cost, currency } = resolvePackCost(pack);
  if (typeof cost === 'number' && currency) {
    if (currency === 'STARS') {
      rewards.push({
        label: locale === 'ru' ? 'Всего Stars' : 'Total Stars',
        value: `${numberFormatter.format(cost)} ⭐`,
        icon: '⚡',
        tone: 'secondary',
      });
    } else {
      const currencyFormatter = new Intl.NumberFormat(localeKey, {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'RUB' ? 0 : 2,
      });
      rewards.push({
        label: locale === 'ru' ? 'Оплата' : 'Charged',
        value: currencyFormatter.format(cost),
        icon: '💳',
        tone: 'secondary',
      });
    }
  }

  if (variant === 'subscription') {
    rewards.push({
      label: locale === 'ru' ? 'Подписка' : 'Subscription',
      value: locale === 'ru' ? 'Автопродление активно' : 'Auto-renew enabled',
      icon: '🔁',
      tone: 'tertiary',
    });
  }

  return rewards;
};

const resolveSupportLink = (
  variant: SuccessVariant,
  locale: SuccessLocale
): SuccessSupportLink | undefined => {
  if (variant === 'subscription') {
    return {
      label: locale === 'ru' ? 'Управление подпиской' : 'Manage subscription',
      href: 'https://t.me/energy_planet_bot/settings',
    };
  }

  if (variant === 'premium') {
    return {
      label: locale === 'ru' ? 'Поддержка премиума' : 'Premium support',
      href: 'https://t.me/energy_planet_bot/support',
    };
  }

  return undefined;
};

const getSectionTabId = (id: ShopSection) => `shop-tab-${id}`;
const getSectionPanelId = (id: ShopSection) => `shop-panel-${id}`;
const COSMETICS_GRID_ID = 'shop-cosmetics-grid';

function formatPriceLabel(priceRub?: number, priceUsd?: number): string {
  if (priceRub) {
    return `${priceRub.toLocaleString('ru-RU')} ₽`;
  }
  if (priceUsd) {
    return `$${priceUsd.toFixed(2)}`;
  }
  return 'Через Telegram';
}

function calculateBonusPercentage(baseStars: number, bonusStars: number): number {
  if (baseStars === 0) return 0;
  return Math.round((bonusStars / baseStars) * 100);
}

const SUBSCRIPTION_MARKERS = ['подпис', 'week', 'недел', 'month', 'месяц', 'sub'];
const BUNDLE_MARKERS = ['bundle', 'набор', 'pack', 'коллекц'];

const AUTO_EQUIP_CATEGORIES = new Set(['planet_skin']);

const resolveStarPackSubSection = (pack: StarPack): StarPackSubSection => {
  const haystack =
    `${pack.title ?? ''} ${pack.description ?? ''} ${pack.telegram_product_id ?? ''}`.toLowerCase();
  if (SUBSCRIPTION_MARKERS.some(marker => haystack.includes(marker))) {
    return 'subscriptions';
  }
  if (
    (pack.bonus_stars ?? 0) > 0 ||
    pack.featured ||
    BUNDLE_MARKERS.some(marker => haystack.includes(marker))
  ) {
    return 'bundles';
  }
  return 'one_time';
};

export function ShopPanel({ activeSection: activeSectionProp, bare = false }: ShopPanelProps) {
  const {
    cosmetics,
    isCosmeticsLoading,
    cosmeticsError,
    isProcessingCosmeticId,
    loadCosmetics,
    purchaseCosmetic,
    equipCosmetic,
  } = useCatalogStore(
    useShallow(state => ({
      cosmetics: state.cosmetics,
      isCosmeticsLoading: state.isCosmeticsLoading,
      cosmeticsError: state.cosmeticsError,
      isProcessingCosmeticId: state.isProcessingCosmeticId,
      loadCosmetics: state.loadCosmetics,
      purchaseCosmetic: state.purchaseCosmetic,
      equipCosmetic: state.equipCosmetic,
    }))
  );
  const {
    starPacks,
    isStarPacksLoading,
    starPacksError,
    isProcessingStarPackId,
    loadStarPacks,
    purchaseStarPack,
  } = useCatalogStore(
    useShallow(state => ({
      starPacks: state.starPacks,
      isStarPacksLoading: state.isStarPacksLoading,
      starPacksError: state.starPacksError,
      isProcessingStarPackId: state.isProcessingStarPackId,
      loadStarPacks: state.loadStarPacks,
      purchaseStarPack: state.purchaseStarPack,
    }))
  );

  const [selectedCategory, setSelectedCategory] = useState<string>('planet_skin');
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotification();
  const activeSection = activeSectionProp ?? 'star_packs';
  const [activeStarPackSection] = useState<StarPackSubSection>('one_time');
  const [purchaseSuccess, setPurchaseSuccess] = useState<PurchaseSuccessState | null>(null);
  const sectionSourceRef = useRef<'initial' | 'user' | 'programmatic'>('initial');
  const lastActiveSectionRef = useRef<ShopSection | null>(null);
  const starPackSectionSourceRef = useRef<'user' | 'programmatic'>('programmatic');
  const lastStarPackSectionRef = useRef<StarPackSubSection | null>(null);
  const lastStarPackViewKeyRef = useRef<string | null>(null);
  const cosmeticsTabsRef = useRef<HTMLDivElement>(null);
  const [showCosmeticsLeftHint, setShowCosmeticsLeftHint] = useState(false);
  const [showCosmeticsRightHint, setShowCosmeticsRightHint] = useState(false);

  useEffect(() => {
    const previous = lastActiveSectionRef.current;
    if (previous === null) {
      void logClientEvent('shop_view', { section: activeSection });
    } else if (previous !== activeSection) {
      void logClientEvent('shop_section_change', {
        from: previous,
        to: activeSection,
        source: sectionSourceRef.current,
      });
    }
    lastActiveSectionRef.current = activeSection;
    sectionSourceRef.current = 'programmatic';
  }, [activeSection]);

  const starPackGroups = useMemo(() => {
    return starPacks.reduce<Record<StarPackSubSection, StarPack[]>>(
      (acc, pack) => {
        const bucket = resolveStarPackSubSection(pack);
        acc[bucket].push(pack);
        return acc;
      },
      { subscriptions: [], one_time: [], bundles: [] }
    );
  }, [starPacks]);

  const visibleStarPacks = starPackGroups[activeStarPackSection];
  const featuredVisiblePack = useMemo(
    () => visibleStarPacks.find(pack => pack.featured) ?? null,
    [visibleStarPacks]
  );
  const featuredPackMetrics = useMemo<ProductMetric[]>(() => {
    if (!featuredVisiblePack) {
      return [];
    }
    const totalStars = featuredVisiblePack.stars + (featuredVisiblePack.bonus_stars ?? 0);
    const bonus = featuredVisiblePack.bonus_stars ?? 0;
    const primaryMetric: ProductMetric = {
      label: 'Всего Stars',
      value: `${totalStars.toLocaleString('ru-RU')} ⭐`,
      icon: '🌌',
      tone: 'primary',
      primary: true,
    };
    if (bonus > 0) {
      return [
        primaryMetric,
        {
          label: `Бонус +${calculateBonusPercentage(featuredVisiblePack.stars, bonus)}%`,
          value: `+${bonus.toLocaleString('ru-RU')} ⭐`,
          icon: '✨',
          tone: 'accent',
        },
      ];
    }
    return [primaryMetric];
  }, [featuredVisiblePack]);
  const regularVisiblePacks = useMemo(
    () => visibleStarPacks.filter(pack => !pack.featured),
    [visibleStarPacks]
  );

  useEffect(() => {
    if (activeSection !== 'star_packs') {
      lastStarPackSectionRef.current = null;
      starPackSectionSourceRef.current = 'programmatic';
      return;
    }

    const previous = lastStarPackSectionRef.current;
    if (previous === null) {
      void logClientEvent('star_pack_section_view', {
        sub_section: activeStarPackSection,
      });
    } else if (previous !== activeStarPackSection) {
      void logClientEvent('star_pack_section_change', {
        from: previous,
        to: activeStarPackSection,
        source: starPackSectionSourceRef.current,
      });
    }
    lastStarPackSectionRef.current = activeStarPackSection;
    starPackSectionSourceRef.current = 'programmatic';
  }, [activeSection, activeStarPackSection]);

  useEffect(() => {
    if (activeSection !== 'star_packs') {
      lastStarPackViewKeyRef.current = null;
      return;
    }
    const packIds: string[] = [];
    if (featuredVisiblePack) {
      packIds.push(featuredVisiblePack.id);
    }
    regularVisiblePacks.forEach(pack => {
      packIds.push(pack.id);
    });
    if (packIds.length === 0) {
      return;
    }

    const packKey = `${activeStarPackSection}:${packIds.join('|')}`;
    if (lastStarPackViewKeyRef.current === packKey) {
      return;
    }
    lastStarPackViewKeyRef.current = packKey;

    void logClientEvent('star_pack_view', {
      sub_section: activeStarPackSection,
      pack_ids: packIds,
    });
  }, [activeSection, activeStarPackSection, featuredVisiblePack, regularVisiblePacks]);
  const bestValuePackId = useMemo(() => {
    const candidates = regularVisiblePacks
      .filter(pack => pack.price_rub || pack.price_usd)
      .map(pack => {
        const totalStars = pack.stars + (pack.bonus_stars ?? 0);
        const price =
          pack.price_rub ?? (pack.price_usd ? pack.price_usd * 100 : Number.POSITIVE_INFINITY);
        return {
          id: pack.id,
          pricePerStar: totalStars > 0 ? price / totalStars : Number.POSITIVE_INFINITY,
        };
      })
      .sort((a, b) => a.pricePerStar - b.pricePerStar);
    return candidates[0]?.id ?? null;
  }, [regularVisiblePacks]);

  useEffect(() => {
    loadCosmetics();
    loadStarPacks();
  }, [loadCosmetics, loadStarPacks]);

  const updateCosmeticsScrollHints = useCallback(() => {
    const node = cosmeticsTabsRef.current;
    if (!node) {
      setShowCosmeticsLeftHint(false);
      setShowCosmeticsRightHint(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = node;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setShowCosmeticsLeftHint(scrollLeft > 4);
    setShowCosmeticsRightHint(scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const node = cosmeticsTabsRef.current;
    if (!node) {
      return;
    }
    updateCosmeticsScrollHints();
    const handleScroll = () => updateCosmeticsScrollHints();
    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, [categories.length, updateCosmeticsScrollHints]);

  const { categories, activeCategory, filteredCosmetics, mostPopularCosmeticId } = useMemo(
    () =>
      buildShopViewModel({
        cosmetics,
        starPacks,
        activeCategory: selectedCategory,
      }),
    [cosmetics, starPacks, selectedCategory]
  );

  const { success: hapticSuccess, error: hapticError } = useHaptic();

  const handleCategoryKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      if (categories.length === 0) {
        return;
      }

      const isDisabled = (categoryId: string) =>
        isCosmeticsLoading && categoryId !== activeCategory;

      const moveToAvailable = (startIndex: number, direction: 1 | -1) => {
        let nextIndex = startIndex;
        for (let i = 0; i < categories.length; i += 1) {
          nextIndex = (nextIndex + direction + categories.length) % categories.length;
          const nextCategory = categories[nextIndex];
          if (!isDisabled(nextCategory.id)) {
            setSelectedCategory(nextCategory.id);
            return;
          }
        }
      };

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          moveToAvailable(index, 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          moveToAvailable(index, -1);
          break;
        case 'Home':
          event.preventDefault();
          for (let i = 0; i < categories.length; i += 1) {
            if (!isDisabled(categories[i].id)) {
              setSelectedCategory(categories[i].id);
              break;
            }
          }
          break;
        case 'End':
          event.preventDefault();
          for (let i = categories.length - 1; i >= 0; i -= 1) {
            if (!isDisabled(categories[i].id)) {
              setSelectedCategory(categories[i].id);
              break;
            }
          }
          break;
        case ' ':
        case 'Enter': {
          const current = categories[index];
          if (current && !isDisabled(current.id)) {
            event.preventDefault();
            setSelectedCategory(current.id);
          }
          break;
        }
        default:
          break;
      }
    },
    [activeCategory, categories, isCosmeticsLoading, setSelectedCategory]
  );

  const handleEquip = useCallback(
    async (cosmeticId: string) => {
      try {
        await equipCosmetic(cosmeticId);
        hapticSuccess();
        notifySuccess('Косметика экипирована');
      } catch (error) {
        hapticError();
        const { message } = describeError(error, 'Не удалось экипировать косметику');
        notifyError(message);
      }
    },
    [equipCosmetic, hapticError, hapticSuccess, notifyError, notifySuccess]
  );

  const handlePurchaseCosmetic = useCallback(
    async (cosmeticId: string) => {
      const purchased = cosmetics.find(item => item.id === cosmeticId);
      try {
        await purchaseCosmetic(cosmeticId);
        hapticSuccess();
        notifySuccess('Косметика разблокирована!');
        if (purchased && AUTO_EQUIP_CATEGORIES.has(purchased.category)) {
          await handleEquip(cosmeticId);
        }
      } catch (error) {
        hapticError();
        const { message } = describeError(error, 'Не удалось купить косметику');
        notifyError(message);
      }
    },
    [
      cosmetics,
      handleEquip,
      hapticError,
      hapticSuccess,
      notifyError,
      notifySuccess,
      purchaseCosmetic,
    ]
  );

  const handleDismissPurchaseSuccess = useCallback(() => {
    setPurchaseSuccess(null);
  }, []);

  const handlePurchaseStarPack = useCallback(
    async (packId: string) => {
      const pack = starPacks.find(item => item.id === packId) ?? null;
      const totalStars = pack ? pack.stars + (pack.bonus_stars ?? 0) : undefined;
      void logClientEvent('star_pack_checkout_start', {
        pack_id: packId,
        section: activeSection,
        sub_section: activeStarPackSection,
        total_stars: totalStars,
      });

      try {
        await purchaseStarPack(packId);
        hapticSuccess();
        notifySuccess('Stars начислены на баланс!');
        if (pack) {
          const locale = resolveLocaleFromNavigator();
          const variant = resolvePackVariant(pack, activeSection, activeStarPackSection);
          if (variant !== 'standard') {
            const { cost, currency } = resolvePackCost(pack);
            const rewards = buildRewardItems(pack, locale, variant);
            const supportLink = resolveSupportLink(variant, locale);
            setPurchaseSuccess({
              itemName: pack.title ?? 'Star Pack',
              quantity: 1,
              cost,
              costCurrency: currency,
              variant,
              locale,
              rewards,
              supportLink,
            });
          }
        }
        void logClientEvent('star_pack_checkout_success', {
          pack_id: packId,
          section: activeSection,
          sub_section: activeStarPackSection,
          total_stars: totalStars,
        });
      } catch (error) {
        hapticError();
        const { status, message } = describeError(error, 'Не удалось купить Stars');
        void logClientEvent(
          'star_pack_checkout_error',
          {
            pack_id: packId,
            section: activeSection,
            sub_section: activeStarPackSection,
            status,
            message,
          },
          'warn'
        );
        if (status === 409) {
          notifyWarning('Покупка уже была оформлена.');
        } else {
          notifyError(message);
        }
      }
    },
    [
      activeSection,
      activeStarPackSection,
      hapticError,
      hapticSuccess,
      notifyError,
      notifySuccess,
      notifyWarning,
      purchaseStarPack,
      starPacks,
    ]
  );

  const lastStarPackErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (starPacksError && starPacksError !== lastStarPackErrorRef.current) {
      notifyError(starPacksError, 4000);
      lastStarPackErrorRef.current = starPacksError;
    } else if (!starPacksError) {
      lastStarPackErrorRef.current = null;
    }
  }, [notifyError, starPacksError]);

  const panelContent = (
    <ShopSectionLayout as="div" className="w-full">
      {/* Errors */}
      {activeSection === 'star_packs' && starPacksError && (
        <Card className="flex flex-col gap-sm bg-state-danger-pill border-state-danger-pill text-feedback-error">
          <span>{starPacksError}</span>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => loadStarPacks(true)}
          >
            Повторить загрузку
          </Button>
        </Card>
      )}
      {activeSection === 'cosmetics' && cosmeticsError && (
        <Card className="bg-state-danger-pill border-state-danger-pill text-feedback-error">
          {cosmeticsError}
        </Card>
      )}

      {activeSection === 'star_packs' && (
        <ShopSectionLayout as="section" aria-label="Паки Stars">
          {featuredVisiblePack && !isStarPacksLoading && (
            <ProductTile
              highlighted
              highlightLabel="Лучший выбор"
              title={featuredVisiblePack.title ?? 'Премиум пакет'}
              description={
                featuredVisiblePack.description ?? 'Получите максимум Stars и премиальные бонусы'
              }
              priceLabel={formatPriceLabel(
                featuredVisiblePack.price_rub,
                featuredVisiblePack.price_usd
              )}
              media={
                featuredVisiblePack.icon_url ? (
                  <OptimizedImage
                    src={featuredVisiblePack.icon_url}
                    alt={featuredVisiblePack.title ?? 'Star Pack'}
                    width={88}
                    height={88}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <Text variant="hero" tone="inverse" aria-hidden="true">
                    ⭐
                  </Text>
                )
              }
              badge={{
                label: `${(
                  featuredVisiblePack.stars + (featuredVisiblePack.bonus_stars ?? 0)
                ).toLocaleString('ru-RU')} ⭐`,
                variant: 'legendary',
              }}
              metrics={featuredPackMetrics}
              actions={
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  className="shadow-glow"
                  loading={isProcessingStarPackId === featuredVisiblePack.id}
                  onClick={() => handlePurchaseStarPack(featuredVisiblePack.id)}
                >
                  <span aria-hidden="true">⚡</span>
                  <span>Купить пакет</span>
                </Button>
              }
            />
          )}

          {isStarPacksLoading && starPacks.length === 0 ? (
            <ErrorBoundary>
              <ShopSkeleton count={3} />
            </ErrorBoundary>
          ) : (
            <ShopSectionLayout as="div" variant="grid" role="list" aria-label="Каталог паков Stars">
              {starPacks
                .filter(pack => !pack.featured)
                .map(pack => {
                  const processing = isProcessingStarPackId === pack.id;
                  const totalStars = pack.stars + (pack.bonus_stars ?? 0);
                  const bonus = pack.bonus_stars ?? 0;
                  const priceLabel = formatPriceLabel(pack.price_rub, pack.price_usd);
                  const isBestValue = bestValuePackId === pack.id;

                  const primaryMetric: ProductMetric = {
                    label: 'Всего Stars',
                    value: `${totalStars.toLocaleString('ru-RU')} ⭐`,
                    icon: '🌌',
                    tone: isBestValue ? 'accent' : 'primary',
                    primary: true,
                  };
                  const metrics: ProductMetric[] =
                    bonus > 0
                      ? [
                          primaryMetric,
                          {
                            label: `Бонус +${calculateBonusPercentage(pack.stars, bonus)}%`,
                            value: `+${bonus.toLocaleString('ru-RU')} ⭐`,
                            icon: '✨',
                            tone: 'accent',
                          },
                        ]
                      : [primaryMetric];

                  return (
                    <ProductTile
                      key={pack.id}
                      title={pack.title}
                      description={
                        pack.description ?? `Получите ${totalStars.toLocaleString('ru-RU')} Stars`
                      }
                      priceLabel={priceLabel}
                      highlighted={isBestValue}
                      highlightLabel={isBestValue ? 'Лучшее соотношение' : undefined}
                      badge={{
                        label: `${totalStars.toLocaleString('ru-RU')} ⭐`,
                        variant: isBestValue ? 'success' : 'primary',
                      }}
                      media={
                        pack.icon_url ? (
                          <OptimizedImage
                            src={pack.icon_url}
                            alt={pack.title ?? 'Star pack'}
                            width={72}
                            height={72}
                            className="h-full w-full rounded-2xl object-cover"
                          />
                        ) : (
                          <Text
                            variant="heading"
                            tone={isBestValue ? 'inverse' : 'accent'}
                            aria-hidden
                          >
                            ⭐
                          </Text>
                        )
                      }
                      metrics={metrics}
                      helper={`Базовых Stars: ${pack.stars.toLocaleString('ru-RU')}`}
                      actions={
                        <Button
                          variant="primary"
                          size="md"
                          fullWidth
                          className={isBestValue ? 'shadow-glow' : undefined}
                          loading={processing}
                          onClick={() => handlePurchaseStarPack(pack.id)}
                        >
                          <span aria-hidden="true">⚡</span>
                          <span>Купить Stars</span>
                        </Button>
                      }
                    />
                  );
                })}
            </ShopSectionLayout>
          )}
        </ShopSectionLayout>
      )}

      {activeSection === 'boosts' && (
        <ShopSectionLayout as="section" aria-label="Бусты">
          <ErrorBoundary>
            <BoostHub showHeader={false} />
          </ErrorBoundary>
        </ShopSectionLayout>
      )}

      {activeSection === 'cosmetics' && (
        <ShopSectionLayout
          as="section"
          id={getSectionPanelId('cosmetics')}
          role="tabpanel"
          aria-labelledby={getSectionTabId('cosmetics')}
        >
          <nav
            className="relative rounded-2xl border border-border-cyan/60 bg-surface-glass-strong"
            role="tablist"
            aria-label="Категории косметики"
          >
            {categories.length === 0 && !isCosmeticsLoading ? (
              <Card className="m-xs flex-1 text-body text-text-secondary bg-token-surface-tertiary border-token-subtle">
                Косметика откроется после уровня 5. Продолжайте улучшать здания и активируйте бусты,
                чтобы увидеть новые стили планеты.
              </Card>
            ) : (
              <div
                ref={cosmeticsTabsRef}
                className="flex gap-xs overflow-x-auto px-xs py-xs scrollbar-hide snap-x snap-mandatory"
              >
                {categories.map((category, index) => {
                  const isActiveCategory = category.id === activeCategory;
                  const isDisabled = isCosmeticsLoading && !isActiveCategory;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      disabled={isDisabled}
                      role="tab"
                      aria-selected={isActiveCategory}
                      aria-controls={COSMETICS_GRID_ID}
                      id={`cosmetics-category-${category.id}`}
                      tabIndex={isActiveCategory ? 0 : -1}
                      onKeyDown={event => handleCategoryKeyDown(event, index)}
                      type="button"
                      className={`min-w-[140px] flex-shrink-0 snap-start rounded-2xl px-sm-plus py-xs-plus text-center text-caption font-semibold uppercase tracking-[0.08em] transition-all duration-150 focus-ring ${
                        isDisabled
                          ? 'cursor-not-allowed opacity-60'
                          : isActiveCategory
                            ? 'bg-gradient-to-r from-accent-cyan/60 via-feedback-success/50 to-accent-magenta/55 text-text-primary shadow-glow'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'
                      }`}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            )}
            {showCosmeticsLeftHint && (
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 rounded-l-2xl bg-gradient-to-r from-surface-primary to-transparent" />
            )}
            {showCosmeticsRightHint && (
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 rounded-r-2xl bg-gradient-to-l from-surface-primary to-transparent" />
            )}
          </nav>

          <ShopSectionLayout as="div" id={COSMETICS_GRID_ID}>
            {isCosmeticsLoading && filteredCosmetics.length === 0 ? (
              <ErrorBoundary>
                <ShopSkeleton count={4} />
              </ErrorBoundary>
            ) : (
              filteredCosmetics.map(cosmetic => {
                const processing = isProcessingCosmeticId === cosmetic.id;
                const price = cosmetic.price_stars ?? 0;
                const isMostPopular = cosmetic.id === mostPopularCosmeticId;

                const rarityMap: Record<
                  string,
                  'default' | 'primary' | 'success' | 'warning' | 'error' | 'epic' | 'legendary'
                > = {
                  common: 'default',
                  rare: 'primary',
                  epic: 'epic',
                  legendary: 'legendary',
                };

                let actionNode: ReactNode;
                if (cosmetic.equipped) {
                  actionNode = (
                    <Button variant="success" size="sm" disabled>
                      Экипировано
                    </Button>
                  );
                } else if (cosmetic.owned) {
                  actionNode = (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={processing}
                      onClick={() => handleEquip(cosmetic.id)}
                    >
                      Экипировать
                    </Button>
                  );
                } else if (cosmetic.status === 'purchase_required' && price > 0) {
                  actionNode = (
                    <Button
                      variant="success"
                      size="sm"
                      loading={processing}
                      onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                    >
                      Купить {price} ⭐
                    </Button>
                  );
                } else if (cosmetic.status === 'locked' && cosmetic.unlock_requirement?.level) {
                  actionNode = (
                    <Text variant="caption" tone={isMostPopular ? 'inverse' : 'secondary'}>
                      Откроется с {cosmetic.unlock_requirement.level} уровня
                    </Text>
                  );
                } else if (cosmetic.status === 'event_locked') {
                  actionNode = (
                    <Text variant="caption" tone={isMostPopular ? 'inverse' : 'secondary'}>
                      Доступно на событии
                    </Text>
                  );
                } else {
                  actionNode = (
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={processing}
                      onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                    >
                      Получить
                    </Button>
                  );
                }

                return (
                  <ProductTile
                    key={cosmetic.id}
                    orientation="horizontal"
                    highlighted={isMostPopular}
                    highlightLabel={isMostPopular ? '⭐ Popular' : undefined}
                    title={cosmetic.name}
                    description={cosmetic.description ?? ''}
                    badge={{
                      label: isMostPopular ? '⭐ Popular' : cosmetic.rarity,
                      variant: isMostPopular
                        ? 'primary'
                        : (rarityMap[cosmetic.rarity] ?? 'default'),
                    }}
                    media={
                      cosmetic.preview_url ? (
                        <OptimizedImage
                          src={cosmetic.preview_url}
                          alt={cosmetic.name}
                          width={72}
                          height={72}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <Text
                          variant="heading"
                          tone={isMostPopular ? 'inverse' : 'accent'}
                          aria-hidden
                        >
                          ✦
                        </Text>
                      )
                    }
                    helper={
                      cosmetic.owned && !cosmetic.equipped
                        ? 'Уже в коллекции — экипируйте, чтобы выделиться.'
                        : undefined
                    }
                    meta={
                      price > 0 ? (
                        <div
                          className={clsx(
                            'flex items-center justify-between rounded-2xl px-sm py-xs',
                            isMostPopular
                              ? 'bg-white/10 text-text-inverse'
                              : 'border border-border-layer bg-layer-overlay-soft text-text-primary'
                          )}
                        >
                          <Text variant="caption" tone={isMostPopular ? 'inverse' : 'secondary'}>
                            Стоимость
                          </Text>
                          <Text
                            variant="bodySm"
                            weight="semibold"
                            tone={isMostPopular ? 'inverse' : 'accent'}
                          >
                            {price.toLocaleString('ru-RU')} ⭐
                          </Text>
                        </div>
                      ) : null
                    }
                    actions={actionNode}
                  />
                );
              })
            )}
          </ShopSectionLayout>
        </ShopSectionLayout>
      )}
    </ShopSectionLayout>
  );

  const renderedPanel = bare ? (
    panelContent
  ) : (
    <Surface
      tone="secondary"
      border="subtle"
      elevation="soft"
      padding="md"
      rounded="3xl"
      className="flex w-full flex-col gap-md"
    >
      {panelContent}
    </Surface>
  );

  return (
    <>
      {renderedPanel}
      {purchaseSuccess ? (
        <PurchaseSuccessModal
          isOpen
          itemName={purchaseSuccess.itemName}
          quantity={purchaseSuccess.quantity}
          cost={purchaseSuccess.cost}
          costCurrency={purchaseSuccess.costCurrency}
          variant={purchaseSuccess.variant}
          locale={purchaseSuccess.locale}
          rewards={purchaseSuccess.rewards}
          supportLink={purchaseSuccess.supportLink}
          autoClose={false}
          onDismiss={handleDismissPurchaseSuccess}
        />
      ) : null}
    </>
  );
}
