import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel, Button, Surface, Text } from '@/components';
import type { ShopSection } from '@/components/ShopPanel';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext';
import { useGameStore } from '@/store/gameStore';
import { useUserLocale } from '@/hooks/useUserLocale';

type CategoryTab = {
  id: ShopCategory;
  title: string;
  description: string;
  icon: string;
};

type CategoryTabDefinition = {
  id: ShopCategory;
  icon: string;
  copy: Record<
    'ru' | 'en',
    {
      title: string;
      description: string;
    }
  >;
};

type ShopCategory = ShopSection | 'buildings';

const SECTION_PARAM = 'section';
const LEGACY_CATEGORY_PARAM = 'category';

const CATEGORY_TAB_DEFINITIONS: CategoryTabDefinition[] = [
  {
    id: 'star_packs',
    icon: '⭐',
    copy: {
      ru: { title: 'Stars', description: 'Выгодные пакеты и бонусы' },
      en: { title: 'Stars', description: 'Best-value packs and bonuses' },
    },
  },
  {
    id: 'boosts',
    icon: '🚀',
    copy: {
      ru: { title: 'Бусты', description: 'Умножайте прибыль и прогресс' },
      en: { title: 'Boosts', description: 'Multiply profit and progress' },
    },
  },
  {
    id: 'cosmetics',
    icon: '✨',
    copy: {
      ru: { title: 'Косметика', description: 'Экипировка для планеты и профиля' },
      en: { title: 'Cosmetics', description: 'Planet and profile customization' },
    },
  },
  {
    id: 'buildings',
    icon: '🏗️',
    copy: {
      ru: { title: 'Постройки', description: 'Улучшаем доход и открываем уровни' },
      en: { title: 'Buildings', description: 'Upgrade income and unlock levels' },
    },
  },
];

const VALID_CATEGORY_IDS = new Set<ShopCategory>(CATEGORY_TAB_DEFINITIONS.map(card => card.id));
const getTabId = (category: ShopCategory) => `shop-tab-${category}`;
const getPanelId = (category: ShopCategory) => `shop-panel-${category}`;

function resolveCategory(value: string | null): ShopCategory | null {
  if (!value) {
    return null;
  }
  return VALID_CATEGORY_IDS.has(value as ShopCategory) ? (value as ShopCategory) : null;
}

export function ShopScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const stars = useGameStore(state => state.stars);
  const boostMultiplier = useGameStore(state => state.boostMultiplier);
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('star_packs');
  const activeCategoryRef = useRef<ShopCategory>('star_packs');
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<ShopCategory, HTMLButtonElement | null>>>({});
  const { language, localeTag } = useUserLocale();

  const renderContext = useMemo(
    () => ({
      category: activeCategory,
    }),
    [activeCategory]
  );

  useRenderLatencyMetric({ screen: 'shop_screen', context: renderContext });

  const handlePageRef = useCallback((node: HTMLDivElement | null) => {
    setScrollContainer(node);
  }, []);

  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = resolveCategory(params.get(SECTION_PARAM));
    const legacyCategory = resolveCategory(params.get(LEGACY_CATEGORY_PARAM));
    const resolvedCategory = section ?? legacyCategory;
    const currentCategory = activeCategoryRef.current;
    if (resolvedCategory && resolvedCategory !== currentCategory) {
      startTransition(() => {
        setActiveCategory(resolvedCategory);
      });
    }
  }, [location.search]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasLegacyParam = params.has(LEGACY_CATEGORY_PARAM);
    const currentSection = params.get(SECTION_PARAM);
    if (currentSection === activeCategory && !hasLegacyParam) {
      return;
    }
    params.set(SECTION_PARAM, activeCategory);
    params.delete(LEGACY_CATEGORY_PARAM);
    navigate({ pathname: '/shop', search: params.toString() }, { replace: true });
  }, [activeCategory, location.search, navigate]);

  const handleTabSelect = useCallback(
    (categoryId: ShopCategory) => {
      setActiveCategory(categoryId);
    },
    [setActiveCategory]
  );

  const heroCta = useCallback(() => {
    setActiveCategory('star_packs');
  }, [setActiveCategory]);

  const formatNumber = useMemo(
    () => new Intl.NumberFormat(localeTag, { notation: 'compact' }),
    [localeTag]
  );

  const tabItems = useMemo<CategoryTab[]>(
    () =>
      CATEGORY_TAB_DEFINITIONS.map(def => ({
        id: def.id,
        icon: def.icon,
        title: def.copy[language].title,
        description: def.copy[language].description,
      })),
    [language]
  );

  const shopCopy = useMemo(
    () =>
      language === 'en'
        ? {
            dealLabel: 'Deal of the day',
            dealTitle: '+25% Stars today',
            dealSubtitle: 'Buy any pack and get a bonus before midnight.',
            balanceLabel: 'Your balance',
            refillCta: 'Add funds',
            boostsLabel: 'Active boosts',
            checkoutLabel: 'Checkout',
            checkoutValue: 'Telegram Pay · Face ID',
            navHeading: 'Shop sections',
            navSubtitle: 'Fewer taps to purchase',
            openHint: 'Tap to open',
            tablistLabel: 'Shop categories',
            freeBlockTitle: 'Free today',
            freeBlockSubtitle: 'Freebies live next to paid offers',
            dailyGiftTitle: 'Daily gift',
            dailyGiftSubtitle: 'Grab a chest and get Stars or boosts.',
            dailyGiftCta: 'Claim',
            upcomingTitle: 'Coming soon',
            upcomingCardTitle: (index: number) => `Incoming drop #${index}`,
            upcomingCardSubtitle: 'Arriving in the next update',
            upcomingBadge: 'soon',
          }
        : {
            dealLabel: 'Акция дня',
            dealTitle: '+25% Stars сегодня',
            dealSubtitle: 'Купите любой пакет и получите бонус до полуночи.',
            balanceLabel: 'Ваш баланс',
            refillCta: 'Пополнить',
            boostsLabel: 'Активные бусты',
            checkoutLabel: 'Оплата',
            checkoutValue: 'Telegram Pay · Face ID',
            navHeading: 'Разделы магазина',
            navSubtitle: 'Минимум касаний до покупки',
            openHint: 'Нажмите, чтобы открыть',
            tablistLabel: 'Категории магазина',
            freeBlockTitle: 'Бесплатно сегодня',
            freeBlockSubtitle: 'Держим freebies рядом с платными предложениями',
            dailyGiftTitle: 'Ежедневный подарок',
            dailyGiftSubtitle: 'Заберите сундук и получите Stars или буст.',
            dailyGiftCta: 'Забрать',
            upcomingTitle: 'Скоро появится',
            upcomingCardTitle: (index: number) => `Новинка #${index}`,
            upcomingCardSubtitle: 'Появится в ближайшем обновлении',
            upcomingBadge: 'скоро',
          },
    [language]
  );

  const focusTabByIndex = useCallback(
    (index: number) => {
      if (!tabItems.length) {
        return;
      }
      const normalized = (index + tabItems.length) % tabItems.length;
      const target = tabItems[normalized];
      setActiveCategory(target.id);
      const node = tabRefs.current[target.id];
      if (node) {
        node.focus();
      }
    },
    [setActiveCategory, tabItems]
  );

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (!tabItems.length) {
        return;
      }
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          focusTabByIndex(index + 1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          focusTabByIndex(index - 1);
          break;
        case 'Home':
          event.preventDefault();
          focusTabByIndex(0);
          break;
        case 'End':
          event.preventDefault();
          focusTabByIndex(tabItems.length - 1);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          setActiveCategory(tabItems[index]?.id ?? tabItems[0].id);
          break;
        default:
          break;
      }
    },
    [focusTabByIndex, setActiveCategory, tabItems]
  );

  return (
    <ScrollContainerContext.Provider value={scrollContainer}>
      <TabPageSurface ref={handlePageRef} className="gap-xl">
        <Surface
          tone="accent"
          border="none"
          elevation="medium"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-lg text-text-inverse"
        >
          <div className="flex flex-col gap-xs">
            <Text variant="caption" tone="inverse">
              {shopCopy.dealLabel}
            </Text>
            <Text variant="title" weight="bold">
              {shopCopy.dealTitle}
            </Text>
            <Text variant="body">{shopCopy.dealSubtitle}</Text>
          </div>
          <div className="flex flex-col gap-sm">
            <Text variant="caption" tone="inverse">
              {shopCopy.balanceLabel}
            </Text>
            <div className="flex items-center justify-between gap-md">
              <div className="flex items-baseline gap-xs">
                <Text variant="hero" weight="bold">
                  {formatNumber.format(stars)}
                </Text>
                <Text variant="bodySm" tone="inverse">
                  ⭐
                </Text>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={heroCta}
                className="border border-white/30 bg-white/10 text-text-inverse hover:bg-white/20"
              >
                {shopCopy.refillCta}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="rounded-2xl border border-white/30 px-md py-sm">
              <Text variant="caption" tone="inverse">
                {shopCopy.boostsLabel}
              </Text>
              <Text variant="title" weight="semibold">
                x{boostMultiplier.toFixed(1)}
              </Text>
            </div>
            <div className="rounded-2xl border border-white/30 px-md py-sm">
              <Text variant="caption" tone="inverse">
                {shopCopy.checkoutLabel}
              </Text>
              <Text variant="bodySm">{shopCopy.checkoutValue}</Text>
            </div>
          </div>
        </Surface>

        <section
          className="flex flex-col gap-lg"
          aria-label={language === 'en' ? 'Shop navigation' : 'Навигация магазина'}
        >
          <div className="flex flex-col gap-xs">
            <Text variant="label" tone="secondary">
              {shopCopy.navHeading}
            </Text>
            <Text variant="bodySm" tone="tertiary">
              {shopCopy.navSubtitle}
            </Text>
          </div>
          <nav
            role="tablist"
            aria-orientation="horizontal"
            aria-label={shopCopy.tablistLabel}
            className="grid grid-cols-2 gap-lg"
          >
            {tabItems.map((tab, index) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={getTabId(tab.id)}
                  aria-selected={isActive}
                  aria-controls={getPanelId(tab.id)}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabSelect(tab.id)}
                  onKeyDown={event => handleTabKeyDown(event, index)}
                  ref={node => {
                    tabRefs.current[tab.id] = node;
                  }}
                  className={`flex flex-col items-start gap-sm rounded-3xl border px-lg py-md text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold ${
                    isActive
                      ? 'border-featured bg-surface-accent text-text-inverse shadow-glow'
                      : 'border-border-layer bg-layer-overlay-soft text-text-primary hover:border-featured'
                  }`}
                >
                  <div className="flex items-center gap-sm">
                    <span className="text-heading" aria-hidden="true">
                      {tab.icon}
                    </span>
                    <Text variant="body" weight="semibold">
                      {tab.title}
                    </Text>
                  </div>
                  <Text variant="bodySm" tone={isActive ? 'inverse' : 'secondary'}>
                    {tab.description}
                  </Text>
                  <Text variant="caption" tone={isActive ? 'inverse' : 'tertiary'}>
                    {shopCopy.openHint}
                  </Text>
                </button>
              );
            })}
          </nav>
          <div
            id={getPanelId(activeCategory)}
            role="tabpanel"
            aria-labelledby={getTabId(activeCategory)}
            className="flex flex-col gap-lg"
          >
            {activeCategory === 'buildings' ? (
              <BuildingsPanel showHeader={false} />
            ) : (
              <ShopPanel activeSection={activeCategory as ShopSection} />
            )}
          </div>
        </section>

        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-md"
        >
          <div className="flex flex-col gap-xs">
            <Text variant="label" tone="secondary">
              {shopCopy.freeBlockTitle}
            </Text>
            <Text variant="bodySm" tone="tertiary">
              {shopCopy.freeBlockSubtitle}
            </Text>
          </div>
          <Surface tone="overlay" border="subtle" elevation="soft" padding="md" rounded="2xl">
            <div className="flex flex-col gap-sm">
              <Text variant="body" weight="semibold">
                {shopCopy.dailyGiftTitle}
              </Text>
              <Text variant="bodySm" tone="secondary">
                {shopCopy.dailyGiftSubtitle}
              </Text>
              <Button type="button" size="md" variant="primary">
                {shopCopy.dailyGiftCta}
              </Button>
            </div>
          </Surface>
        </Surface>

        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-md"
        >
          <Text variant="label" tone="secondary">
            {shopCopy.upcomingTitle}
          </Text>
          <div className="flex flex-col gap-sm">
            {[1, 2].map(item => (
              <Surface
                key={item}
                tone="overlay"
                border="subtle"
                elevation="soft"
                padding="md"
                rounded="2xl"
                className="flex items-center justify-between border-dashed"
              >
                <div className="flex flex-col gap-xs">
                  <Text variant="body" weight="semibold">
                    {shopCopy.upcomingCardTitle(item)}
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    {shopCopy.upcomingCardSubtitle}
                  </Text>
                </div>
                <Text variant="label" tone="secondary">
                  {shopCopy.upcomingBadge}
                </Text>
              </Surface>
            ))}
          </div>
        </Surface>
      </TabPageSurface>
    </ScrollContainerContext.Provider>
  );
}
