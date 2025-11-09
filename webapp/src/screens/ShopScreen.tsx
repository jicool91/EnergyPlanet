import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel, Button, Surface, Text } from '@/components';
import type { ShopSection } from '@/components/ShopPanel';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext';
import { useGameStore } from '@/store/gameStore';

interface CategoryTab {
  id: ShopCategory;
  title: string;
  description: string;
  icon: string;
}

type ShopCategory = ShopSection | 'buildings';

const SECTION_PARAM = 'section';
const LEGACY_CATEGORY_PARAM = 'category';

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'star_packs', title: 'Stars', description: 'Выгодные пакеты и бонусы', icon: '⭐' },
  { id: 'boosts', title: 'Бусты', description: 'Умножайте прибыль и прогресс', icon: '🚀' },
  {
    id: 'cosmetics',
    title: 'Косметика',
    description: 'Экипировка для планеты и профиля',
    icon: '✨',
  },
  {
    id: 'buildings',
    title: 'Постройки',
    description: 'Улучшаем доход и открываем уровни',
    icon: '🏗️',
  },
];

const VALID_CATEGORY_IDS = new Set<ShopCategory>(CATEGORY_TABS.map(card => card.id));
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

  const handleTabSelect = useCallback((categoryId: ShopCategory) => {
    setActiveCategory(categoryId);
  }, []);

  const heroCta = useCallback(() => {
    setActiveCategory('star_packs');
  }, []);

  const formatNumber = useMemo(() => new Intl.NumberFormat('ru-RU', { notation: 'compact' }), []);

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
              Акция дня
            </Text>
            <Text variant="title" weight="bold">
              +25% Stars сегодня
            </Text>
            <Text variant="body">Купите любой пакет и получите бонус до полуночи.</Text>
          </div>
          <div className="flex flex-col gap-sm">
            <Text variant="caption" tone="inverse">
              Ваш баланс
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
                Пополнить
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-md">
            <div className="rounded-2xl border border-white/30 px-md py-sm">
              <Text variant="caption" tone="inverse">
                Активные бусты
              </Text>
              <Text variant="title" weight="semibold">
                x{boostMultiplier.toFixed(1)}
              </Text>
            </div>
            <div className="rounded-2xl border border-white/30 px-md py-sm">
              <Text variant="caption" tone="inverse">
                Checkout
              </Text>
              <Text variant="bodySm">Telegram Pay · Face ID</Text>
            </div>
          </div>
        </Surface>

        <section className="flex flex-col gap-lg" aria-label="Навигация магазина">
          <div className="flex flex-col gap-xs">
            <Text variant="label" tone="secondary">
              Разделы магазина
            </Text>
            <Text variant="bodySm" tone="tertiary">
              Минимум касаний до покупки
            </Text>
          </div>
          <nav role="tablist" aria-label="Категории магазина" className="grid grid-cols-2 gap-lg">
            {CATEGORY_TABS.map(tab => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={getTabId(tab.id)}
                  aria-selected={isActive}
                  aria-controls={getPanelId(tab.id)}
                  onClick={() => handleTabSelect(tab.id)}
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
                    Tap to open
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
              Бесплатно сегодня
            </Text>
            <Text variant="bodySm" tone="tertiary">
              Держим freebies рядом с платными предложениями
            </Text>
          </div>
          <Surface tone="overlay" border="subtle" elevation="soft" padding="md" rounded="2xl">
            <div className="flex flex-col gap-sm">
              <Text variant="body" weight="semibold">
                Ежедневный подарок
              </Text>
              <Text variant="bodySm" tone="secondary">
                Заберите сундук и получите Stars или буст.
              </Text>
              <Button type="button" size="md" variant="primary">
                Забрать
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
            Скоро появится
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
                    Новинка #{item}
                  </Text>
                  <Text variant="bodySm" tone="secondary">
                    Появится в ближайшем обновлении
                  </Text>
                </div>
                <Text variant="label" tone="secondary">
                  скоро
                </Text>
              </Surface>
            ))}
          </div>
        </Surface>
      </TabPageSurface>
    </ScrollContainerContext.Provider>
  );
}
