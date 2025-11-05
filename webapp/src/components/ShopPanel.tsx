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

const STAR_PACK_SECTION_LABELS: Record<StarPackSubSection, string> = {
  one_time: 'Разовые паки',
  subscriptions: 'Подписки',
  bundles: 'Наборы',
};

const BOOST_SECTION_LABELS: Record<BoostSubSection, string> = {
  daily: 'Ежедневные бусты',
  ad: 'Рекламные бусты',
  premium: 'Премиум бусты',
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
  const activeCosmeticsCategoryLabel = useMemo(() => {
    return categories.find(category => category.id === activeCategory)?.label ?? null;
  }, [categories, activeCategory]);

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
            return 'Постоянные бонусы без ручных пополнений — выберите удобную подписку.';
          case 'bundles':
            return 'Комбо-наборы с дополнительными Stars и редкими эффектами.';
          default:
            return 'Подберите пакет Stars, чтобы ускорить прогресс и открыть новые бусты.';
        }
      case 'boosts':
        switch (activeBoostSection) {
          case 'ad':
            return 'Просматривайте ролики и мгновенно усиливайте множители.';
          case 'premium':
            return 'Премиум-бусты дают длительный эффект и суммируются с другими бонусами.';
          default:
            return 'Ежедневные бусты не дают прогрессу остановиться — держите множитель активным.';
        }
      default:
        if (activeSection === 'cosmetics') {
          return activeCosmeticsCategoryLabel
            ? `Тематические стили: ${activeCosmeticsCategoryLabel}`
            : 'Измените внешний вид планеты и выделитесь в рейтинге.';
        }
        return 'Создайте уникальный образ и мотивируйте друзей возвращаться каждый день.';
    }
  }, [activeSection, activeBoostSection, activeStarPackSection, activeCosmeticsCategoryLabel]);

  const sectionHelper = useMemo(() => {
    switch (activeSection) {
      case 'star_packs':
        switch (activeStarPackSection) {
          case 'subscriptions':
            return 'Еженедельные и месячные подписки автоматически начисляют Stars и бонусы.';
          case 'bundles':
            return 'Эксклюзивные наборы объединяют Stars, бусты и косметику со скидкой.';
          default:
            return 'Разовые паки подходят для быстрого апгрейда зданий и покупки бустов.';
        }
      case 'boosts':
        switch (activeBoostSection) {
          case 'ad':
            return 'Умные рекламные бусты помогают монетизировать внимание без paywall.';
          case 'premium':
            return 'Лучшие предложения для платных подписчиков — создайте эффект VIP-доступа.';
          default:
            return 'Ежедневные бусты возвращают игроков и поддерживают вовлечённость.';
        }
      default:
        if (activeSection === 'cosmetics') {
          return 'Косметика подчёркивает статус — используйте редкие облики для социальных доказательств.';
        }
        return 'Комбинируйте визуальные и экономические предложения, чтобы усилить удержание.';
    }
  }, [activeSection, activeBoostSection, activeStarPackSection]);

  const heroTitle = useMemo(() => {
    switch (activeSection) {
      case 'star_packs':
        return 'Подберите Stars под свою стратегию';
      case 'boosts':
        return 'Удерживайте множитель на пике';
      case 'cosmetics':
        return 'Сделайте планету заметной';
      default:
        return 'Откройте новые возможности';
    }
  }, [activeSection]);

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

  const breadcrumbLabel = useMemo(() => {
    const parts: string[] = ['Магазин'];
    switch (activeSection) {
      case 'star_packs':
        parts.push('Паки Stars');
        parts.push(STAR_PACK_SECTION_LABELS[activeStarPackSection]);
        break;
      case 'boosts':
        parts.push('Бусты');
        parts.push(BOOST_SECTION_LABELS[activeBoostSection]);
        break;
      case 'cosmetics':
        parts.push('Косметика');
        if (activeCosmeticsCategoryLabel) {
          parts.push(activeCosmeticsCategoryLabel);
        }
        break;
      default:
        break;
    }
    return parts.length > 1 ? parts.join(' → ') : null;
  }, [activeSection, activeStarPackSection, activeBoostSection, activeCosmeticsCategoryLabel]);

  const breadcrumbLogRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!breadcrumbLabel) {
      return;
    }
    if (breadcrumbLogRef.current.has(breadcrumbLabel)) {
      return;
    }
    breadcrumbLogRef.current.add(breadcrumbLabel);
    void logClientEvent('shop_breadcrumb_view', {
      label: breadcrumbLabel,
      section: activeSection,
      star_section: activeSection === 'star_packs' ? activeStarPackSection : undefined,
      boost_section: activeSection === 'boosts' ? activeBoostSection : undefined,
      cosmetics_category:
        activeSection === 'cosmetics' ? (activeCosmeticsCategoryLabel ?? undefined) : undefined,
    });
  }, [
    breadcrumbLabel,
    activeSection,
    activeStarPackSection,
    activeBoostSection,
    activeCosmeticsCategoryLabel,
  ]);

  const sectionTabList = (
    <div
      className="flex flex-wrap gap-xs rounded-2xl border border-border-cyan/50 bg-surface-glass p-xs"
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
            className={`flex-1 min-w-[120px] rounded-xl px-sm-plus py-xs-plus text-body font-semibold transition-all duration-150 focus-ring ${
              isActive
                ? 'bg-gradient-to-r from-accent-cyan/60 via-feedback-success/45 to-accent-magenta/55 text-text-primary shadow-glow'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'
            }`}
          >
            {section.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-lg">
      {showHeader ? (
        <section className="rounded-3xl border border-border-cyan/50 bg-surface-glass-strong px-lg py-lg shadow-elevation-4">
          <div className="flex flex-col gap-sm">
            {breadcrumbLabel ? (
              <div
                className="inline-flex w-fit items-center gap-xs rounded-full border border-tag-accent-border bg-state-cyan-pill-glow px-sm-plus py-xs-plus text-caption font-semibold text-text-secondary"
                role="status"
                aria-live="polite"
              >
                {breadcrumbLabel}
              </div>
            ) : null}
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div className="flex flex-col gap-xs max-w-[540px]">
                <h2 className="m-0 text-heading font-bold text-text-primary">{heroTitle}</h2>
                <p className="m-0 text-body text-text-secondary">{sectionSubtitle}</p>
                {sectionHelper ? (
                  <p className="m-0 text-caption text-text-secondary/80">{sectionHelper}</p>
                ) : null}
              </div>
              {activeSection === 'star_packs' && featuredVisiblePack ? (
                <div className="flex items-center gap-sm rounded-2xl border border-accent-gold/50 bg-layer-overlay-strong px-md py-sm shadow-glow-gold">
                  <div className="flex flex-col gap-xs">
                    <span className="text-caption font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      Рекомендуем сегодня
                    </span>
                    <span className="text-body font-semibold text-text-primary">
                      {featuredVisiblePack.title}
                    </span>
                    <span className="text-caption text-text-secondary">
                      +{featuredVisiblePack.bonus_stars ?? 0} бонусных ⭐ внутри
                    </span>
                  </div>
                  <button
                    onClick={() => handleStarPackSectionChange('bundles')}
                    className="rounded-full border border-accent-gold/70 bg-accent-gold/20 px-sm-plus py-xs-plus text-caption font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-offset-2 focus-visible:ring-offset-layer-overlay-strong"
                    type="button"
                  >
                    Смотреть
                  </button>
                </div>
              ) : null}
            </div>
            {sectionTabList}
          </div>
        </section>
      ) : null}

      {!showHeader && (
        <div className="flex flex-col gap-sm">
          {breadcrumbLabel ? (
            <div
              className="inline-flex w-fit items-center gap-xs rounded-full border border-tag-accent-border bg-state-cyan-pill-glow px-sm-plus py-xs-plus text-caption font-semibold text-text-secondary"
              role="status"
              aria-live="polite"
            >
              {breadcrumbLabel}
            </div>
          ) : null}
          {sectionTabList}
        </div>
      )}

      {/* Errors */}
      {activeSection === 'star_packs' && starPacksError && (
        <Card className="bg-state-danger-pill border-state-danger-pill text-feedback-error">
          {starPacksError}
        </Card>
      )}
      {activeSection === 'cosmetics' && cosmeticsError && (
        <Card className="bg-state-danger-pill border-state-danger-pill text-feedback-error">
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
            className="flex flex-wrap gap-xs rounded-2xl border border-border-cyan/50 bg-surface-glass p-xs"
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
                  className={`flex-1 sm:flex-none min-w-[140px] text-center rounded-xl px-sm-plus py-xs-plus text-body font-semibold transition-all duration-150 focus-ring ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-cyan/60 via-feedback-success/50 to-accent-magenta/55 text-text-primary shadow-glow'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <div className="rounded-2xl border border-tag-accent-border bg-surface-glass-strong p-md shadow-glow">
            <p className="m-0 text-body font-semibold text-text-primary">{starPackBannerText}</p>
          </div>
          {featuredVisiblePack && !isStarPacksLoading && (
            <Card className="relative flex flex-col md:flex-row gap-4 overflow-hidden rounded-2xl border border-accent-gold/60 bg-gradient-holographic shadow-glow-gold">
              <div className="absolute inset-0 bg-gradient-premium opacity-40" aria-hidden />
              <div className="relative flex items-center justify-center md:justify-start">
                <div className="w-[88px] h-[88px] rounded-2xl border border-accent-gold/70 bg-surface-glass flex items-center justify-center overflow-hidden">
                  {featuredVisiblePack.icon_url ? (
                    <OptimizedImage
                      src={featuredVisiblePack.icon_url}
                      alt={featuredVisiblePack.title}
                      width={88}
                      height={88}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-display" aria-hidden>
                      ⭐
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex-1 flex flex-col gap-md">
                <div className="flex flex-wrap items-center gap-sm">
                  <Badge variant="warning" size="sm">
                    ЛУЧШИЙ ВЫБОР
                  </Badge>
                  <Badge variant="success" size="sm">
                    {featuredVisiblePack.stars + (featuredVisiblePack.bonus_stars ?? 0)} ⭐
                  </Badge>
                </div>
                <h3 className="m-0 text-heading font-bold text-text-primary">
                  {featuredVisiblePack.title}
                </h3>
                <p className="m-0 text-body text-text-secondary">
                  {featuredVisiblePack.description ??
                    'Получите максимум Stars и премиальные бонусы'}
                </p>

                <div className="grid gap-sm rounded-2xl border border-accent-gold/50 bg-surface-glass-strong p-md">
                  <div className="flex items-center justify-between text-body text-text-secondary">
                    <span className="flex items-center gap-sm">
                      <span className="text-title" aria-hidden>
                        ⭐
                      </span>
                      Базовых Stars
                    </span>
                    <span className="text-title font-bold text-accent-gold">
                      {featuredVisiblePack.stars}
                    </span>
                  </div>
                  {(featuredVisiblePack.bonus_stars ?? 0) > 0 && (
                    <>
                      <div className="flex items-center justify-between text-body text-text-secondary">
                        <span className="flex items-center gap-sm">
                          <span className="text-title" aria-hidden>
                            ✨
                          </span>
                          Бонусные Stars
                        </span>
                        <span className="text-title font-bold text-feedback-success">
                          +{featuredVisiblePack.bonus_stars}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/10 pt-sm text-body text-text-secondary">
                        <span className="flex items-center gap-sm">
                          <span className="text-title" aria-hidden>
                            🚀
                          </span>
                          Буст к доходу
                        </span>
                        <span className="text-title font-bold text-feedback-success">
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

                <div className="flex flex-wrap items-center gap-sm">
                  <div className="text-title font-semibold text-accent-gold flex-1">
                    {formatPriceLabel(featuredVisiblePack.price_rub, featuredVisiblePack.price_usd)}
                  </div>
                  {featuredVisiblePack.price_rub && (
                    <div className="text-label rounded-full border border-accent-gold/60 bg-accent-gold/20 px-sm-plus py-xs text-accent-gold">
                      {(
                        featuredVisiblePack.price_rub /
                        (featuredVisiblePack.stars + (featuredVisiblePack.bonus_stars ?? 0))
                      ).toFixed(1)}{' '}
                      ₽/⭐
                    </div>
                  )}
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <Button
                  variant="success"
                  size="lg"
                  className="min-w-[160px] shadow-glow-gold"
                  loading={isProcessingStarPackId === featuredVisiblePack.id}
                  onClick={() => handlePurchaseStarPack(featuredVisiblePack.id)}
                >
                  Купить пакет
                </Button>
              </div>
            </Card>
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
              <Card className="text-body text-token-secondary bg-token-surface-tertiary border-token-subtle">
                <h3 className="m-0 text-body text-token-primary">{BUNDLE_PLACEHOLDER.title}</h3>
                <p className="m-0 mt-2 text-caption text-token-secondary">
                  {BUNDLE_PLACEHOLDER.description}
                </p>
                <p className="m-0 mt-2 text-caption text-token-secondary/80">
                  {BUNDLE_PLACEHOLDER.note}
                </p>
              </Card>
            ) : (
              <Card className="text-body text-token-secondary bg-token-surface-tertiary border-token-subtle">
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
                  className={`relative flex flex-col sm:flex-row gap-4 rounded-2xl border ${
                    isBestValue
                      ? 'border-feedback-success/70 bg-gradient-soft shadow-glow-lime'
                      : 'border-border-cyan/60 bg-surface-glass-strong shadow-elevation-2'
                  } overflow-hidden`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-[72px] h-[72px] rounded-2xl border ${
                        isBestValue
                          ? 'border-feedback-success/80 bg-feedback-success/15'
                          : 'border-border-cyan/70 bg-accent-cyan/15'
                      } flex items-center justify-center overflow-hidden`}
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
                        <span className="text-title" aria-hidden>
                          ⭐
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-sm">
                    <div className="flex flex-wrap items-center justify-between gap-sm">
                      <h3
                        className={`m-0 text-title font-semibold text-text-primary ${
                          isBestValue ? 'text-feedback-success' : ''
                        }`}
                      >
                        {pack.title}
                      </h3>
                      <Badge variant={isBestValue ? 'success' : 'primary'} size="sm">
                        {totalStars} ⭐
                      </Badge>
                    </div>
                    <p className="m-0 text-body-sm text-text-secondary">
                      {pack.description ?? `Получите ${totalStars} Stars`}
                    </p>

                    <div className="grid gap-xs rounded-xl border border-border-layer/60 bg-layer-overlay-ghost-soft px-sm-plus py-sm">
                      <div className="flex items-center justify-between text-body-sm text-text-secondary">
                        <span>⭐ Базовых</span>
                        <span
                          className={`font-semibold ${isBestValue ? 'text-feedback-success' : 'text-accent-gold'}`}
                        >
                          {pack.stars}
                        </span>
                      </div>
                      {bonus > 0 && (
                        <>
                          <div className="flex items-center justify-between text-body-sm text-text-secondary">
                            <span>✨ Бонус</span>
                            <span className="font-semibold text-feedback-success">+{bonus}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-white/10 pt-xs text-body-sm text-text-secondary">
                            <span>🚀 Буст</span>
                            <span className="font-semibold text-feedback-success">
                              +{calculateBonusPercentage(pack.stars, bonus)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-sm">
                      <div
                        className={`text-body-sm flex-1 ${
                          isBestValue
                            ? 'text-feedback-success font-semibold'
                            : 'text-text-secondary'
                        }`}
                      >
                        {priceLabel}
                      </div>
                      {pack.price_rub && (
                        <div
                          className={`text-label rounded-full border px-sm-plus py-xs whitespace-nowrap ${
                            isBestValue
                              ? 'border-feedback-success/60 bg-feedback-success/15 text-feedback-success'
                              : 'border-border-cyan bg-state-cyan-pill-glow text-accent-cyan'
                          }`}
                        >
                          {(pack.price_rub / totalStars).toFixed(1)} ₽/⭐
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <Button
                      variant="success"
                      size="md"
                      className={isBestValue ? 'shadow-glow-lime' : 'shadow-elevation-1'}
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
            className="flex flex-wrap gap-xs rounded-2xl border border-border-cyan/60 bg-surface-glass-strong p-xs"
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
                  className={`flex-1 sm:flex-none min-w-[140px] text-center rounded-2xl px-sm-plus py-xs-plus text-caption font-semibold uppercase tracking-[0.08em] transition-all duration-150 focus-ring ${
                    isActive
                      ? 'bg-gradient-to-r from-accent-cyan/60 via-feedback-success/50 to-accent-magenta/55 text-text-primary shadow-glow'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'
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
            className="flex flex-wrap gap-xs rounded-2xl border border-border-cyan/60 bg-surface-glass-strong p-xs"
            role="tablist"
            aria-label="Категории косметики"
          >
            {categories.length === 0 && !isCosmeticsLoading && (
              <Card className="flex-1 text-body text-token-secondary bg-token-surface-tertiary border-token-subtle">
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
                  className={`flex-1 sm:flex-none min-w-[140px] rounded-2xl px-sm-plus py-xs-plus text-center text-caption font-semibold uppercase tracking-[0.08em] transition-all duration-150 focus-ring ${
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
