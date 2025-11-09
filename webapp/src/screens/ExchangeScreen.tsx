import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel, Button } from '@/components';
import type { ShopSection } from '@/components/ShopPanel';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';

type ExchangeCategory = ShopSection | 'buildings';

interface CategoryChip {
  id: ExchangeCategory;
  label: string;
  icon: string;
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { id: 'star_packs', label: 'Stars', icon: '⭐' },
  { id: 'boosts', label: 'Бусты', icon: '🚀' },
  { id: 'cosmetics', label: 'Косметика', icon: '✨' },
  { id: 'buildings', label: 'Постройки', icon: '🏗️' },
];

export function ExchangeScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<ExchangeCategory>('star_packs');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const renderContext = useMemo(
    () => ({
      category: activeCategory,
    }),
    [activeCategory]
  );

  useRenderLatencyMetric({ screen: 'exchange_screen', context: renderContext });

  // Sync with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category') as ExchangeCategory | null;
    if (category && CATEGORY_CHIPS.some(chip => chip.id === category)) {
      startTransition(() => {
        setActiveCategory(category);
      });
    }
  }, [location.search]);

  // Update URL when category changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('category') === activeCategory) {
      return;
    }
    params.set('category', activeCategory);
    navigate({ pathname: '/exchange', search: params.toString() }, { replace: true });
  }, [activeCategory, location.search, navigate]);

  const handleCategoryChange = useCallback((categoryId: ExchangeCategory) => {
    setActiveCategory(categoryId);
  }, []);

  return (
    <TabPageSurface className="gap-4">
      {/* Horizontal scrolling category chips */}
      <div className="relative -mx-4 px-4" ref={scrollContainerRef}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORY_CHIPS.map(chip => {
            const isActive = activeCategory === chip.id;
            return (
              <Button
                key={chip.id}
                type="button"
                size="sm"
                variant={isActive ? 'primary' : 'ghost'}
                onClick={() => handleCategoryChange(chip.id)}
                className={clsx(
                  'flex-shrink-0 gap-2 rounded-full px-4 py-2',
                  !isActive && 'hover:bg-layer-overlay-ghost-soft'
                )}
              >
                <span className="text-base" aria-hidden="true">
                  {chip.icon}
                </span>
                <span className="text-sm font-semibold whitespace-nowrap">{chip.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content based on active category */}
      {activeCategory === 'buildings' ? (
        <BuildingsPanel showHeader={false} />
      ) : (
        <ShopPanel activeSection={activeCategory} />
      )}
    </TabPageSurface>
  );
}
