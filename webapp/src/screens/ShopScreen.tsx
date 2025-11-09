import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel, Button, Surface, Text } from '@/components';
import type { ShopSection } from '@/components/ShopPanel';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext';
import { useGameStore } from '@/store/gameStore';

interface CategoryCard {
  id: ShopCategory;
  title: string;
  description: string;
  icon: string;
}

type ShopCategory = ShopSection | 'buildings';

const SECTION_PARAM = 'section';
const LEGACY_CATEGORY_PARAM = 'category';

const CATEGORY_CARDS: CategoryCard[] = [
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

const VALID_CATEGORY_IDS = new Set<ShopCategory>(CATEGORY_CARDS.map(card => card.id));

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

  const handleCategoryToggle = useCallback((categoryId: ShopCategory) => {
    setActiveCategory(prev => (prev === categoryId ? categoryId : categoryId));
  }, []);

  const heroCta = useCallback(() => {
    setActiveCategory('star_packs');
  }, []);

  const formatNumber = useMemo(() => new Intl.NumberFormat('ru-RU', { notation: 'compact' }), []);

  return (
    <ScrollContainerContext.Provider value={scrollContainer}>
      <TabPageSurface ref={handlePageRef} className="gap-4">
        <Surface
          tone="accent"
          border="none"
          elevation="medium"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-3 text-text-inverse"
        >
          <Text variant="title" weight="bold">
            +25% Stars сегодня
          </Text>
          <Text variant="body">
            Акция действует до полуночи. Купите любой пакет и получите дополнительный бонус.
          </Text>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col">
              <Text variant="caption" tone="inverse">
                Баланс Stars
              </Text>
              <Text variant="hero" weight="bold">
                {formatNumber.format(stars)} ⭐
              </Text>
            </div>
            <div className="flex flex-col">
              <Text variant="caption" tone="inverse">
                Активные бусты
              </Text>
              <Text variant="title" weight="semibold">
                x{boostMultiplier.toFixed(1)}
              </Text>
            </div>
            <Button type="button" variant="primary" onClick={heroCta}>
              Купить Stars
            </Button>
          </div>
        </Surface>

        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="md"
          rounded="3xl"
          className="flex flex-col gap-md"
        >
          <Text variant="label" tone="secondary">
            Разделы магазина
          </Text>
          <div className="flex flex-col gap-sm">
            {CATEGORY_CARDS.map(card => {
              const expanded = activeCategory === card.id;
              return (
                <Surface
                  key={card.id}
                  tone={expanded ? 'dual' : 'secondary'}
                  border={expanded ? 'accent' : 'subtle'}
                  elevation={expanded ? 'medium' : 'soft'}
                  padding="md"
                  rounded="2xl"
                  className="flex flex-col gap-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-heading" aria-hidden="true">
                        {card.icon}
                      </span>
                      <div className="flex flex-col">
                        <Text variant="body" weight="semibold">
                          {card.title}
                        </Text>
                        <Text variant="bodySm" tone="secondary">
                          {card.description}
                        </Text>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={expanded ? 'primary' : 'ghost'}
                      onClick={() => handleCategoryToggle(card.id)}
                    >
                      {expanded ? 'Свернуть' : 'Открыть'}
                    </Button>
                  </div>
                  {expanded ? (
                    card.id === 'buildings' ? (
                      <BuildingsPanel showHeader={false} bare />
                    ) : (
                      <ShopPanel activeSection={card.id as ShopSection} bare />
                    )
                  ) : null}
                </Surface>
              );
            })}
          </div>
        </Surface>

        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="md"
          rounded="3xl"
          className="flex flex-col gap-sm"
        >
          <Text variant="label" tone="secondary">
            Бесплатно сегодня
          </Text>
          <Surface tone="overlay" border="subtle" elevation="soft" padding="md" rounded="2xl">
            <div className="flex flex-col gap-sm">
              <Text variant="body" weight="semibold">
                Ежедневный подарок
              </Text>
              <Text variant="bodySm" tone="secondary">
                Заберите сундук и получите Stars или буст.
              </Text>
              <Button type="button" size="sm" variant="primary">
                Забрать
              </Button>
            </div>
          </Surface>
        </Surface>

        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="md"
          rounded="3xl"
          className="flex flex-col gap-sm"
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
                <div className="flex flex-col">
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
