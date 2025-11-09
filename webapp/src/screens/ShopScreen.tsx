import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, ShopPanel, BuildingsPanel, Button } from '@/components';
import type { ShopSection } from '@/components/ShopPanel';
import { useRenderLatencyMetric } from '@/hooks/useRenderLatencyMetric';
import { ScrollContainerContext } from '@/contexts/ScrollContainerContext';

type ShopCategory = ShopSection | 'buildings';

interface CategoryChip {
  id: ShopCategory;
  label: string;
  icon: string;
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { id: 'star_packs', label: 'Stars', icon: '⭐' },
  { id: 'boosts', label: 'Бусты', icon: '🚀' },
  { id: 'cosmetics', label: 'Косметика', icon: '✨' },
  { id: 'buildings', label: 'Постройки', icon: '🏗️' },
];

const SECTION_PARAM = 'section';
const LEGACY_CATEGORY_PARAM = 'category';

const VALID_CATEGORY_IDS = new Set<ShopCategory>(CATEGORY_CHIPS.map(chip => chip.id));

function resolveCategory(value: string | null): ShopCategory | null {
  if (!value) {
    return null;
  }
  return VALID_CATEGORY_IDS.has(value as ShopCategory) ? (value as ShopCategory) : null;
}

export function ShopScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState<ShopCategory>('star_packs');
  const activeCategoryRef = useRef<ShopCategory>('star_packs');
  const chipsViewportRef = useRef<HTMLDivElement>(null);
  const activeChipRef = useRef<HTMLButtonElement | null>(null);
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null);

  const renderContext = useMemo(
    () => ({
      category: activeCategory,
    }),
    [activeCategory]
  );

  useRenderLatencyMetric({ screen: 'shop_screen', context: renderContext });
  const updateChipScrollHints = useCallback(() => {
    const node = chipsViewportRef.current;
    if (!node) {
      setShowLeftHint(false);
      setShowRightHint(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = node;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setShowLeftHint(scrollLeft > 4);
    setShowRightHint(scrollLeft < maxScrollLeft - 4);
  }, []);

  useEffect(() => {
    const node = chipsViewportRef.current;
    if (!node) {
      return;
    }

    const handleScroll = () => updateChipScrollHints();
    node.addEventListener('scroll', handleScroll, { passive: true });

    const hasWindow = typeof window !== 'undefined';
    if (hasWindow) {
      window.addEventListener('resize', handleScroll);
      const raf = window.requestAnimationFrame(() => handleScroll());
      return () => {
        node.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        window.cancelAnimationFrame(raf);
      };
    }

    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, [updateChipScrollHints]);

  useEffect(() => {
    const node = chipsViewportRef.current;
    if (!node) {
      return;
    }

    if (typeof window === 'undefined') {
      node.dispatchEvent(new Event('scroll'));
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      node.dispatchEvent(new Event('scroll'));
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [activeCategory]);

  const handlePageRef = useCallback((node: HTMLDivElement | null) => {
    setScrollContainer(node);
  }, []);

  // Keep ref in sync to compare inside URL sync effect without re-running it on state changes
  useEffect(() => {
    activeCategoryRef.current = activeCategory;
  }, [activeCategory]);

  // Sync with URL params
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

  // Update URL when category changes
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

  const handleCategoryChange = useCallback((categoryId: ShopCategory) => {
    setActiveCategory(categoryId);
  }, []);

  useEffect(() => {
    if (activeChipRef.current) {
      activeChipRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeCategory]);

  return (
    <ScrollContainerContext.Provider value={scrollContainer}>
      <TabPageSurface ref={handlePageRef} className="gap-4">
        {/* Horizontal scrolling category chips */}
        <div className="relative">
          <div
            ref={chipsViewportRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory scroll-smooth"
          >
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
                    'flex-shrink-0 gap-2 rounded-full px-4 py-2 snap-start',
                    !isActive && 'hover:bg-layer-overlay-ghost-soft'
                  )}
                  ref={isActive ? activeChipRef : undefined}
                >
                  <span className="text-base" aria-hidden="true">
                    {chip.icon}
                  </span>
                  <span className="text-sm font-semibold whitespace-nowrap">{chip.label}</span>
                </Button>
              );
            })}
          </div>
          {showLeftHint && (
            <div
              className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-surface-primary to-transparent"
              aria-hidden="true"
            />
          )}
          {showRightHint && (
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface-primary to-transparent"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Content based on active category */}
        {activeCategory === 'buildings' ? (
          <BuildingsPanel showHeader={false} />
        ) : (
          <ShopPanel activeSection={activeCategory} />
        )}
      </TabPageSurface>
    </ScrollContainerContext.Provider>
  );
}
