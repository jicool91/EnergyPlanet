import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useCatalogStore } from '../store/catalogStore';
import { buildShopViewModel } from '@/viewModels/shopViewModel';
import { ShopSkeleton, ErrorBoundary } from './skeletons';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { OptimizedImage } from './OptimizedImage';
import { useHaptic } from '../hooks/useHaptic';
import { useNotification } from '../hooks/useNotification';
import { describeError } from '../store/storeUtils';
import { BoostHub } from './BoostHub';
import type { StarPack } from '@/services/starPacks';
import { logClientEvent } from '@/services/telemetry';

interface ShopPanelProps {
  showHeader?: boolean;
  activeSection?: ShopSection;
  onSectionChange?: (section: ShopSection) => void;
}

export type ShopSection = 'star_packs' | 'cosmetics' | 'boosts';
type StarPackSubSection = 'subscriptions' | 'one_time' | 'bundles';
type BoostSubSection = 'daily' | 'ad' | 'premium';

const SECTION_TABS: { id: ShopSection; label: string }[] = [
  { id: 'star_packs', label: 'Паки Stars' },
  { id: 'boosts', label: 'Бусты' },
  { id: 'cosmetics', label: 'Косметика' },
];
const STAR_PACK_TABS: Array<{ id: StarPackSubSection; label: string }> = [
  { id: 'one_time', label: 'Разовые пакеты' },
  { id: 'subscriptions', label: 'Подписки' },
  { id: 'bundles', label: 'Наборы' },
];
const BOOST_TABS: Array<{ id: BoostSubSection; label: string }> = [
  { id: 'daily', label: 'Ежедневные' },
  { id: 'ad', label: 'Рекламные' },
  { id: 'premium', label: 'Премиум' },
];

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

const SUBSCRIPTION_PLACEHOLDERS = [
  {
    id: 'weekly_subscription',
    title: 'Еженедельная подписка',
    description: ' +5% к пассивному доходу и ежедневный бонус 250 ⭐',
    priceLabel: '349 ₽ / неделя',
  },
  {
    id: 'monthly_subscription',
    title: 'Ежемесячная подписка',
    description: '+12% к пассивному доходу и ежедневный бонус 500 ⭐',
    priceLabel: '999 ₽ / месяц',
  },
];

const BUNDLE_PLACEHOLDER = {
  title: 'Комбо-набор (в разработке)',
  description: 'Планируем объединить Stars и уникальные косметические предметы в один пакет.',
  note: 'Следите за анонсами — здесь появятся ограниченные наборы с особыми эффектами.',
};

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

export function ShopPanel({
  showHeader = true,
  activeSection: activeSectionProp,
  onSectionChange,
}: ShopPanelProps) {
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

  const [internalSection, setInternalSection] = useState<ShopSection>(
    activeSectionProp ?? 'star_packs'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('planet_skin');
  const { success: notifySuccess, error: notifyError, warning: notifyWarning } = useNotification();
  const isControlled = typeof activeSectionProp !== 'undefined';
  const activeSection = isControlled ? activeSectionProp : internalSection;
  const [activeStarPackSection, setActiveStarPackSection] =
    useState<StarPackSubSection>('one_time');
  const [activeBoostSection, setActiveBoostSection] = useState<BoostSubSection>('daily');
  const sectionSourceRef = useRef<'initial' | 'user' | 'programmatic'>('initial');
  const lastActiveSectionRef = useRef<ShopSection | null>(null);
  const starPackSectionSourceRef = useRef<'user' | 'programmatic'>('programmatic');
  const lastStarPackSectionRef = useRef<StarPackSubSection | null>(null);
  const lastStarPackViewKeyRef = useRef<string | null>(null);

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

  const changeSection = useCallback(
    (section: ShopSection) => {
      sectionSourceRef.current = 'user';
      if (!isControlled) {
        setInternalSection(section);
      }
      onSectionChange?.(section);
    },
    [isControlled, onSectionChange]
  );

  const handleStarPackSectionChange = useCallback((section: StarPackSubSection) => {
    starPackSectionSourceRef.current = 'user';
    setActiveStarPackSection(section);
  }, []);

  const handleBoostSectionChange = useCallback((section: BoostSubSection) => {
    setActiveBoostSection(section);
  }, []);

  useEffect(() => {
    loadCosmetics();
    loadStarPacks();
  }, [loadCosmetics, loadStarPacks]);

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
  const handleSectionKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = SECTION_TABS.length - 1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          changeSection(SECTION_TABS[nextIndex].id);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = index === 0 ? lastIndex : index - 1;
          changeSection(SECTION_TABS[prevIndex].id);
          break;
        }
        case 'Home':
          event.preventDefault();
          changeSection(SECTION_TABS[0].id);
          break;
        case 'End':
          event.preventDefault();
          changeSection(SECTION_TABS[lastIndex].id);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          changeSection(SECTION_TABS[index].id);
          break;
        default:
          break;
      }
    },
    [changeSection]
  );

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

  const handlePurchaseCosmetic = useCallback(
    async (cosmeticId: string) => {
      try {
        await purchaseCosmetic(cosmeticId);
        hapticSuccess();
        notifySuccess('Косметика разблокирована!');
      } catch (error) {
        hapticError();
        const { message } = describeError(error, 'Не удалось купить косметику');
        notifyError(message);
      }
    },
    [hapticError, hapticSuccess, notifyError, notifySuccess, purchaseCosmetic]
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

  const sectionSubtitle = useMemo(() => {
    switch (activeSection) {
      case 'star_packs':
        switch (activeStarPackSection) {
          case 'subscriptions':
            return 'Оформите подписку и получайте Stars автоматически';
          case 'bundles':
            return 'Комбо-наборы с бонусами и ускорителями';
          default:
            return 'Получите Stars и разблокируйте новые возможности';
        }
      case 'boosts':
        switch (activeBoostSection) {
          case 'ad':
            return 'Смотрите короткие ролики и получайте мгновенные бусты';
          case 'premium':
            return 'Премиум-бусты для подписчиков с максимальным эффектом';
          default:
            return 'Ежедневные бусты держат множитель в тонусе';
        }
      default:
        if (activeSection === 'cosmetics') {
          const categoryLabel = categories.find(cat => cat.id === activeCategory)?.label;
          return categoryLabel
            ? `Косметика: ${categoryLabel}`
            : 'Кастомизируйте вашу планету эксклюзивной косметикой';
        }
        return 'Кастомизируйте вашу планету эксклюзивной косметикой';
    }
  }, [activeSection, activeBoostSection, activeStarPackSection, activeCategory, categories]);

  const sectionHelper = useMemo(() => {
    switch (activeSection) {
      case 'star_packs':
        switch (activeStarPackSection) {
          case 'subscriptions':
            return 'Выберите недельную или месячную подписку — Stars будут начисляться автоматически.';
          case 'bundles':
            return 'Бонусные наборы содержат больше Stars и дополнительные привилегии.';
          default:
            return 'Разовые паки удобны для стремительных апгрейдов и покупки бустов.';
        }
      case 'boosts':
        switch (activeBoostSection) {
          case 'ad':
            return 'Каждый просмотр рекламы открывает временный множитель энергии.';
          case 'premium':
            return 'Премиум-бусты работают дольше и суммируются с другими эффектами.';
          default:
            return 'Ежедневные бусты обновляются сами — не забывайте заглядывать.';
        }
      default:
        if (activeSection === 'cosmetics') {
          return 'Выбирайте темы и эффекты по вкусу — новые категории открываются с уровнем.';
        }
        return 'Косметика и бусты возвращают игроков — используйте оба инструмента.';
    }
  }, [activeSection, activeBoostSection, activeStarPackSection]);

  const starPackBannerText = useMemo(() => {
    switch (activeStarPackSection) {
      case 'subscriptions':
        return 'Оформите подписку и забудьте о ручных пополнениях — Stars будут приходить сами.';
      case 'bundles':
        return 'Наборы с бонусами дают больше Stars и открывают дополнительные награды.';
      default:
        return 'Stars ускоряют пассивный доход и помогают быстрее достичь следующей цели.';
    }
  }, [activeStarPackSection]);

  return (
    <div className="flex flex-col gap-md">
      {showHeader ? (
        <div className="flex flex-col gap-1">
          <h2 className="m-0 mb-1 text-heading font-bold bg-gradient-to-r from-gold to-orange bg-clip-text text-transparent">
            🚀 Power Up
          </h2>
          <p className="m-0 text-caption text-token-secondary">{sectionSubtitle}</p>
          {sectionHelper ? (
            <p className="m-0 mt-1 text-xs text-token-secondary/80">{sectionHelper}</p>
          ) : null}
        </div>
      ) : null}

      {/* Section Tabs */}
      <nav
        className="flex gap-1 rounded-xl bg-[var(--color-surface-secondary)]/70 p-1"
        role="tablist"
        aria-label="Разделы магазина"
      >
        {SECTION_TABS.map((section, index) => {
          const isActive = activeSection === section.id;
          const tabId = getSectionTabId(section.id);
          const panelId = getSectionPanelId(section.id);

          return (
            <button
              key={section.id}
              onClick={() => changeSection(section.id)}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              id={tabId}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={event => handleSectionKeyDown(event, index)}
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-ring ${
                isActive
                  ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-glow'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </nav>

      {/* Errors */}
      {activeSection === 'star_packs' && starPacksError && (
        <Card className="bg-[var(--color-text-destructive)]/10 border-[var(--color-text-destructive)]/40 text-[var(--color-text-destructive)]">
          {starPacksError}
        </Card>
      )}
      {activeSection === 'cosmetics' && cosmeticsError && (
        <Card className="bg-[var(--color-text-destructive)]/10 border-[var(--color-text-destructive)]/40 text-[var(--color-text-destructive)]">
          {cosmeticsError}
        </Card>
      )}

      {activeSection === 'star_packs' && (
        <div
          className="flex flex-col gap-md"
          id={getSectionPanelId('star_packs')}
          role="tabpanel"
          aria-labelledby={getSectionTabId('star_packs')}
        >
          <nav
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--color-surface-secondary)]/70 p-1"
            aria-label="Категории паков"
            role="tablist"
          >
            {STAR_PACK_TABS.map(tab => {
              const isActive = tab.id === activeStarPackSection;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleStarPackSectionChange(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex-1 sm:flex-none min-w-[120px] text-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-ring ${
                    isActive
                      ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-glow'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <Card className="bg-cyan/10 border-cyan/20 text-sm text-token-secondary">
            <strong className="text-token-primary">Совет:</strong> {starPackBannerText}
          </Card>
          {featuredVisiblePack && !isStarPacksLoading && (
            <div className="relative">
              <div className="absolute -inset-px bg-gradient-to-r from-gold via-orange to-gold opacity-20 rounded-2xl blur-lg pointer-events-none" />
              <Card
                highlighted
                highlightBadge="✨ ЛУЧШИЙ ВЫБОР"
                className="relative flex gap-4 bg-gradient-to-br from-dark-secondary/80 to-dark-tertiary/80 border-gold/30"
              >
                <div className="w-[80px] h-[80px] rounded-xl bg-dark-tertiary flex items-center justify-center overflow-hidden border-2 border-gold/40 flex-shrink-0">
                  {featuredVisiblePack.icon_url ? (
                    <OptimizedImage
                      src={featuredVisiblePack.icon_url}
                      alt={featuredVisiblePack.title}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-icon-lg" aria-hidden="true">
                      ⭐
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="m-0 text-body font-bold text-[var(--color-gold)]">
                      {featuredVisiblePack.title}
                    </h3>
                    <Badge variant="warning" size="sm">
                      {featuredVisiblePack.stars + (featuredVisiblePack.bonus_stars ?? 0)} ⭐ всего
                    </Badge>
                  </div>
                  <p className="m-0 text-caption text-token-secondary">
                    {featuredVisiblePack.description ?? `Получите максимум Stars`}
                  </p>

                  <div className="bg-dark-tertiary/40 rounded-lg p-3 border border-gold/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          ⭐
                        </span>
                        <span className="text-sm text-token-secondary">Базовых</span>
                      </div>
                      <span className="text-sm font-bold text-gold">
                        {featuredVisiblePack.stars}
                      </span>
                    </div>
                    {(featuredVisiblePack.bonus_stars ?? 0) > 0 && (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg" aria-hidden="true">
                              ✨
                            </span>
                            <span className="text-sm text-token-secondary">Бонус</span>
                          </div>
                          <span className="text-sm font-bold text-lime">
                            +{featuredVisiblePack.bonus_stars}
                          </span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg" aria-hidden="true">
                              🚀
                            </span>
                            <span className="text-sm text-token-secondary">Буст</span>
                          </div>
                          <span className="text-sm font-bold text-lime">
                            +
                            {calculateBonusPercentage(
                              featuredVisiblePack.stars,
                              featuredVisiblePack.bonus_stars ?? 0
                            )}
                            %
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex gap-3 items-center">
                    <div className="text-caption text-gold/80 font-semibold flex-1">
                      {formatPriceLabel(
                        featuredVisiblePack.price_rub,
                        featuredVisiblePack.price_usd
                      )}
                    </div>
                    {featuredVisiblePack.price_rub && (
                      <div className="text-caption text-gold/70 px-2 py-1 rounded bg-gold/10 border border-gold/20 whitespace-nowrap">
                        {(
                          featuredVisiblePack.price_rub /
                          (featuredVisiblePack.stars + (featuredVisiblePack.bonus_stars ?? 0))
                        ).toFixed(1)}{' '}
                        ₽/⭐
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <Button
                    variant="success"
                    size="lg"
                    loading={isProcessingStarPackId === featuredVisiblePack.id}
                    onClick={() => handlePurchaseStarPack(featuredVisiblePack.id)}
                  >
                    Купить
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {isStarPacksLoading && visibleStarPacks.length === 0 ? (
            <ErrorBoundary>
              <ShopSkeleton count={3} />
            </ErrorBoundary>
          ) : visibleStarPacks.length === 0 ? (
            activeStarPackSection === 'subscriptions' ? (
              <div className="grid gap-md md:grid-cols-2">
                {SUBSCRIPTION_PLACEHOLDERS.map(plan => (
                  <Card
                    key={plan.id}
                    className="flex flex-col gap-sm bg-token-surface-tertiary border-token-subtle"
                  >
                    <h3 className="m-0 text-subheading text-token-primary">{plan.title}</h3>
                    <p className="m-0 text-caption text-token-secondary">{plan.description}</p>
                    <div className="text-body font-semibold text-token-primary">
                      {plan.priceLabel}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        notifyWarning(
                          'Подписки появятся позже. Мы сообщим о запуске через уведомление и соцсети.'
                        )
                      }
                    >
                      Сообщить о старте
                    </Button>
                  </Card>
                ))}
              </div>
            ) : activeStarPackSection === 'bundles' ? (
              <Card className="text-sm text-token-secondary bg-token-surface-tertiary border-token-subtle">
                <h3 className="m-0 text-body text-token-primary">{BUNDLE_PLACEHOLDER.title}</h3>
                <p className="m-0 mt-2 text-caption text-token-secondary">
                  {BUNDLE_PLACEHOLDER.description}
                </p>
                <p className="m-0 mt-2 text-caption text-token-secondary/80">
                  {BUNDLE_PLACEHOLDER.note}
                </p>
              </Card>
            ) : (
              <Card className="text-sm text-token-secondary bg-token-surface-tertiary border-token-subtle">
                В этом разделе пока нет предложений. Следите за новостями, чтобы не пропустить
                свежие пакеты.
              </Card>
            )
          ) : (
            regularVisiblePacks.map(pack => {
              const processing = isProcessingStarPackId === pack.id;
              const totalStars = pack.stars + (pack.bonus_stars ?? 0);
              const bonus = pack.bonus_stars ?? 0;
              const priceLabel = formatPriceLabel(pack.price_rub, pack.price_usd);
              const isBestValue = bestValuePackId === pack.id;

              return (
                <Card
                  key={pack.id}
                  highlighted={isBestValue}
                  highlightBadge={isBestValue ? '💰 BEST VALUE' : undefined}
                  className={`flex gap-4 ${isBestValue ? 'bg-gradient-to-br from-dark-secondary/60 to-dark-tertiary/60 border-lime/30' : ''}`}
                >
                  <div
                    className={`w-[72px] h-[72px] rounded-xl bg-dark-tertiary flex items-center justify-center overflow-hidden flex-shrink-0 ${isBestValue ? 'border-2 border-lime/40' : 'border border-cyan/10'}`}
                  >
                    {pack.icon_url ? (
                      <OptimizedImage
                        src={pack.icon_url}
                        alt={pack.title}
                        width={72}
                        height={72}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-icon-md" aria-hidden="true">
                        ⭐
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-2">
                      <h3
                        className={`m-0 text-body font-semibold ${isBestValue ? 'text-lime' : 'text-token-primary'}`}
                      >
                        {pack.title}
                      </h3>
                      <Badge variant={isBestValue ? 'success' : 'primary'} size="sm">
                        {totalStars} ⭐
                      </Badge>
                    </div>
                    <p className="m-0 text-caption text-token-secondary">
                      {pack.description ?? `Получите ${totalStars} Stars`}
                    </p>

                    <div
                      className={`text-xs space-y-1 rounded px-2 py-1.5 ${isBestValue ? 'bg-lime/10 border border-lime/20' : 'bg-white/5 border border-white/10'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-token-secondary">⭐ Базовых:</span>
                        <span className={`font-bold ${isBestValue ? 'text-lime' : 'text-gold'}`}>
                          {pack.stars}
                        </span>
                      </div>
                      {bonus > 0 && (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-token-secondary">✨ Бонус:</span>
                            <span className="font-bold text-lime">+{bonus}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-1">
                            <span className="text-token-secondary">🚀 Буст:</span>
                            <span className="font-bold text-lime">
                              +{calculateBonusPercentage(pack.stars, bonus)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 items-center">
                      <div
                        className={`text-caption flex-1 ${isBestValue ? 'text-lime/80 font-semibold' : 'text-token-secondary'}`}
                      >
                        {priceLabel}
                      </div>
                      {pack.price_rub && (
                        <div
                          className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${isBestValue ? 'bg-lime/20 border border-lime/30 text-lime font-bold' : 'bg-cyan/10 border border-cyan/20 text-cyan/80'}`}
                        >
                          {(pack.price_rub / totalStars).toFixed(1)} ₽/⭐
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center flex-shrink-0">
                    <Button
                      variant="success"
                      size="md"
                      loading={processing}
                      onClick={() => handlePurchaseStarPack(pack.id)}
                    >
                      Купить Stars
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
      {activeSection === 'boosts' && (
        <div
          className="flex flex-col gap-md"
          id={getSectionPanelId('boosts')}
          role="tabpanel"
          aria-labelledby={getSectionTabId('boosts')}
        >
          <nav
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--color-surface-secondary)]/70 p-1"
            aria-label="Категории бустов"
            role="tablist"
          >
            {BOOST_TABS.map(tab => {
              const isActive = tab.id === activeBoostSection;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleBoostSectionChange(tab.id)}
                  role="tab"
                  aria-selected={isActive}
                  className={`flex-1 sm:flex-none min-w-[120px] text-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-ring ${
                    isActive
                      ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-glow'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <ErrorBoundary>
            <BoostHub showHeader={false} filter={activeBoostSection} />
          </ErrorBoundary>
        </div>
      )}

      {activeSection === 'cosmetics' && (
        <div
          className="flex flex-col gap-md"
          id={getSectionPanelId('cosmetics')}
          role="tabpanel"
          aria-labelledby={getSectionTabId('cosmetics')}
        >
          <nav
            className="flex flex-wrap gap-1 rounded-xl bg-[var(--color-surface-secondary)]/70 p-1"
            role="tablist"
            aria-label="Категории косметики"
          >
            {categories.length === 0 && !isCosmeticsLoading && (
              <Card className="flex-1 text-sm text-token-secondary bg-token-surface-tertiary border-token-subtle">
                Косметика откроется после уровня 5. Продолжайте улучшать здания и активируйте бусты,
                чтобы увидеть новые стили планеты.
              </Card>
            )}

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
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-ring flex-1 sm:flex-none min-w-[120px] text-center ${
                    isDisabled
                      ? 'opacity-60 cursor-not-allowed'
                      : isActiveCategory
                        ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-glow'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {category.label}
                </button>
              );
            })}
          </nav>

          <div id={COSMETICS_GRID_ID} className="flex flex-col gap-md">
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

                let actionButton: ReactNode = null;

                if (cosmetic.equipped) {
                  actionButton = (
                    <Button variant="success" size="md" disabled>
                      Экипировано
                    </Button>
                  );
                } else if (cosmetic.owned) {
                  actionButton = (
                    <Button
                      variant="secondary"
                      size="md"
                      loading={processing}
                      onClick={() => handleEquip(cosmetic.id)}
                    >
                      Экипировать
                    </Button>
                  );
                } else if (cosmetic.status === 'purchase_required' && price > 0) {
                  actionButton = (
                    <Button
                      variant="success"
                      size="md"
                      loading={processing}
                      onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                    >
                      Купить {price} ⭐
                    </Button>
                  );
                } else if (cosmetic.status === 'locked' && cosmetic.unlock_requirement?.level) {
                  actionButton = (
                    <div className="text-caption text-token-secondary">
                      Откроется с {cosmetic.unlock_requirement.level} уровня
                    </div>
                  );
                } else if (cosmetic.status === 'event_locked') {
                  actionButton = (
                    <div className="text-caption text-token-secondary">Доступно на событии</div>
                  );
                } else {
                  actionButton = (
                    <Button
                      variant="secondary"
                      size="md"
                      loading={processing}
                      onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                    >
                      Получить
                    </Button>
                  );
                }

                return (
                  <Card
                    key={cosmetic.id}
                    highlighted={isMostPopular}
                    highlightBadge={isMostPopular ? '⭐ POPULAR' : undefined}
                    className={`flex gap-4 ${isMostPopular ? 'bg-gradient-to-br from-dark-secondary/60 to-dark-tertiary/60 border-cyan/30' : ''}`}
                  >
                    <div
                      className={`w-[72px] h-[72px] rounded-xl bg-dark-tertiary flex items-center justify-center overflow-hidden flex-shrink-0 ${isMostPopular ? 'border-2 border-cyan/40' : 'border border-cyan/10'}`}
                    >
                      {cosmetic.preview_url ? (
                        <OptimizedImage
                          src={cosmetic.preview_url}
                          alt={cosmetic.name}
                          width={72}
                          height={72}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-icon-md" aria-hidden="true">
                          ✦
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center gap-2">
                        <h3
                          className={`m-0 text-body font-semibold ${isMostPopular ? 'text-cyan' : 'text-token-primary'}`}
                        >
                          {cosmetic.name}
                        </h3>
                        <Badge
                          variant={
                            isMostPopular ? 'primary' : rarityMap[cosmetic.rarity] || 'default'
                          }
                          size="sm"
                        >
                          {isMostPopular ? '⭐ Popular' : cosmetic.rarity}
                        </Badge>
                      </div>
                      <p className="m-0 text-caption text-token-secondary">
                        {cosmetic.description}
                      </p>
                      {price > 0 && cosmetic.status !== 'owned' && (
                        <div className="text-caption text-token-secondary">
                          Стоимость: {price} ⭐
                        </div>
                      )}
                    </div>

                    <div className="flex items-center flex-shrink-0">{actionButton}</div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
