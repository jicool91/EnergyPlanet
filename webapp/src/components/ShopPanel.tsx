import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ShopSkeleton, ErrorBoundary } from './skeletons';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';

type CategoryOption = {
  id: string;
  label: string;
};

type ShopSection = 'star_packs' | 'cosmetics';

const SECTION_TABS: { id: ShopSection; label: string }[] = [
  { id: 'star_packs', label: 'Паки Stars' },
  { id: 'cosmetics', label: 'Косметика' },
];

const CATEGORY_LABELS: Record<string, string> = {
  avatar_frame: 'Рамки аватара',
  planet_skin: 'Планеты',
  tap_effect: 'Эффекты тапа',
  background: 'Фоны',
};

function resolveCategoryOptions(categories: string[]): CategoryOption[] {
  return categories.map(category => ({
    id: category,
    label: CATEGORY_LABELS[category] ?? category,
  }));
}

function formatPriceLabel(priceRub?: number, priceUsd?: number): string {
  if (priceRub) {
    return `${priceRub.toLocaleString('ru-RU')} ₽`;
  }
  if (priceUsd) {
    return `$${priceUsd.toFixed(2)}`;
  }
  return 'Через Telegram';
}

export function ShopPanel() {
  const {
    cosmetics,
    isCosmeticsLoading,
    cosmeticsError,
    isProcessingCosmeticId,
    starPacks,
    isStarPacksLoading,
    starPacksError,
    isProcessingStarPackId,
    loadCosmetics,
    loadStarPacks,
    purchaseCosmetic,
    purchaseStarPack,
    equipCosmetic,
  } = useGameStore();

  const [activeSection, setActiveSection] = useState<ShopSection>('star_packs');
  const [activeCategory, setActiveCategory] = useState<string>('planet_skin');

  useEffect(() => {
    loadCosmetics();
    loadStarPacks();
  }, [loadCosmetics, loadStarPacks]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(cosmetics.map(item => item.category)));
    return resolveCategoryOptions(unique);
  }, [cosmetics]);

  useEffect(() => {
    if (categories.length === 0) {
      return;
    }

    const nextCategory = categories[0]?.id;
    if (!activeCategory || !categories.some(category => category.id === activeCategory)) {
      setActiveCategory(nextCategory);
    }
  }, [categories, activeCategory]);

  const filteredCosmetics = useMemo(
    () => cosmetics.filter(item => item.category === activeCategory),
    [cosmetics, activeCategory]
  );

  const handlePurchaseCosmetic = async (cosmeticId: string) => {
    try {
      await purchaseCosmetic(cosmeticId);
    } catch (error) {
      console.error('Failed to purchase cosmetic', error);
    }
  };

  const handleEquip = async (cosmeticId: string) => {
    try {
      await equipCosmetic(cosmeticId);
    } catch (error) {
      console.error('Failed to equip cosmetic', error);
    }
  };

  const handlePurchaseStarPack = async (packId: string) => {
    try {
      await purchaseStarPack(packId);
    } catch (error) {
      console.error('Failed to purchase star pack', error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="m-0 mb-1 text-heading text-white font-semibold">Магазин</h2>
          <p className="m-0 text-caption text-white/60">Покупайте Stars и кастомизируйте планету</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            loading={isStarPacksLoading || isCosmeticsLoading}
            onClick={() => {
              loadStarPacks(true);
              loadCosmetics(true);
            }}
          >
            Обновить
          </Button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 p-0">
        {SECTION_TABS.map(section => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'primary' : 'ghost'}
            size="md"
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </div>

      {/* Errors */}
      {activeSection === 'star_packs' && starPacksError && (
        <Card className="bg-red-error/15 border-red-error/40 text-red-error">{starPacksError}</Card>
      )}
      {activeSection === 'cosmetics' && cosmeticsError && (
        <Card className="bg-red-error/15 border-red-error/40 text-red-error">{cosmeticsError}</Card>
      )}

      {/* Cosmetics Categories */}
      {activeSection === 'cosmetics' && (
        <div className="flex gap-2 flex-wrap p-0">
          {categories.length === 0 && !isCosmeticsLoading && (
            <span className="text-caption text-white/60">Пока нет косметики для отображения</span>
          )}

          {categories.map(category => (
            <Button
              key={category.id}
              variant={category.id === activeCategory ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setActiveCategory(category.id)}
              disabled={isCosmeticsLoading && category.id !== activeCategory}
            >
              {category.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 p-0">
        {activeSection === 'star_packs' ? (
          isStarPacksLoading && starPacks.length === 0 ? (
            <ErrorBoundary>
              <ShopSkeleton count={3} />
            </ErrorBoundary>
          ) : (
            starPacks.map(pack => {
              const processing = isProcessingStarPackId === pack.id;
              const totalStars = pack.stars + (pack.bonus_stars ?? 0);
              const bonus = pack.bonus_stars ?? 0;
              const priceLabel = formatPriceLabel(pack.price_rub, pack.price_usd);

              return (
                <Card
                  key={pack.id}
                  highlighted={pack.featured}
                  highlightBadge={pack.featured ? 'Лучший выбор' : undefined}
                  className="flex gap-4"
                >
                  {/* Icon */}
                  <div className="w-[72px] h-[72px] rounded-xl bg-dark-tertiary flex items-center justify-center overflow-hidden border border-cyan/10 flex-shrink-0">
                    {pack.icon_url ? (
                      <img
                        src={pack.icon_url}
                        alt={pack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[28px]" aria-hidden="true">
                        ⭐
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="m-0 text-body font-semibold text-white">{pack.title}</h3>
                      <Badge variant="primary" size="sm">
                        Stars
                      </Badge>
                    </div>
                    <p className="m-0 text-caption text-white/70">
                      {pack.description ?? `Получите ${totalStars} Stars`}
                    </p>
                    <div className="text-caption text-white/65">{priceLabel}</div>
                    <div className="flex gap-3 text-caption text-white/70">
                      <span className="font-semibold">{totalStars} ⭐ всего</span>
                      {bonus > 0 && <span className="text-gold font-semibold">+{bonus} бонус</span>}
                    </div>
                  </div>

                  {/* Button */}
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
          )
        ) : isCosmeticsLoading && filteredCosmetics.length === 0 ? (
          <ErrorBoundary>
            <ShopSkeleton count={4} />
          </ErrorBoundary>
        ) : (
          filteredCosmetics.map(cosmetic => {
            const processing = isProcessingCosmeticId === cosmetic.id;
            const price = cosmetic.price_stars ?? 0;

            // Determine rarity variant for badge
            const rarityMap: Record<
              string,
              'default' | 'primary' | 'success' | 'warning' | 'error' | 'epic' | 'legendary'
            > = {
              common: 'default',
              rare: 'primary',
              epic: 'epic',
              legendary: 'legendary',
            };

            // Determine action button
            let actionButton: JSX.Element | null = null;

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
                <div className="text-caption text-white/60">
                  Откроется с {cosmetic.unlock_requirement.level} уровня
                </div>
              );
            } else if (cosmetic.status === 'event_locked') {
              actionButton = <div className="text-caption text-white/60">Доступно на событии</div>;
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
              <Card key={cosmetic.id} className="flex gap-4">
                {/* Icon */}
                <div className="w-[72px] h-[72px] rounded-xl bg-dark-tertiary flex items-center justify-center overflow-hidden border border-cyan/10 flex-shrink-0">
                  {cosmetic.preview_url ? (
                    <img
                      src={cosmetic.preview_url}
                      alt={cosmetic.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[28px]" aria-hidden="true">
                      ✦
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="m-0 text-body font-semibold text-white">{cosmetic.name}</h3>
                    <Badge variant={rarityMap[cosmetic.rarity] || 'default'} size="sm">
                      {cosmetic.rarity}
                    </Badge>
                  </div>
                  <p className="m-0 text-caption text-white/70">{cosmetic.description}</p>
                  {price > 0 && cosmetic.status !== 'owned' && (
                    <div className="text-caption text-white/65">Стоимость: {price} ⭐</div>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center flex-shrink-0">{actionButton}</div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
