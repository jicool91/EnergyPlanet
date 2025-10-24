import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ShopSkeleton, ErrorBoundary } from './skeletons';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { OptimizedImage } from './OptimizedImage';
import { useHaptic } from '../hooks/useHaptic';

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

function calculateBonusPercentage(baseStars: number, bonusStars: number): number {
  if (baseStars === 0) return 0;
  return Math.round((bonusStars / baseStars) * 100);
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

  // Calculate best value pack (lowest price per star)
  const bestValuePack = useMemo(() => {
    const regularPacks = starPacks.filter(pack => !pack.featured);
    if (regularPacks.length === 0) return null;

    const withRatio = regularPacks.map(pack => ({
      ...pack,
      pricePerStar: pack.price_rub
        ? pack.price_rub / (pack.stars + (pack.bonus_stars ?? 0))
        : Infinity,
    }));

    return withRatio.reduce((best, current) =>
      current.pricePerStar < best.pricePerStar ? current : best
    );
  }, [starPacks]);

  // Determine "Most Popular" cosmetic (first in category, or could be random/configurable)
  const mostPopularCosmeticId = useMemo(() => {
    return filteredCosmetics.length > 0 ? filteredCosmetics[0]?.id : null;
  }, [filteredCosmetics]);

  const { success: hapticSuccess, error: hapticError } = useHaptic();

  const handlePurchaseCosmetic = async (cosmeticId: string) => {
    try {
      await purchaseCosmetic(cosmeticId);
      hapticSuccess();
    } catch (error) {
      hapticError();
      console.error('Failed to purchase cosmetic', error);
    }
  };

  const handleEquip = async (cosmeticId: string) => {
    try {
      await equipCosmetic(cosmeticId);
      hapticSuccess();
    } catch (error) {
      hapticError();
      console.error('Failed to equip cosmetic', error);
    }
  };

  const handlePurchaseStarPack = async (packId: string) => {
    try {
      await purchaseStarPack(packId);
      hapticSuccess();
    } catch (error) {
      hapticError();
      console.error('Failed to purchase star pack', error);
    }
  };

  const featuredPack = starPacks.find(pack => pack.featured);

  return (
    <div
      className="flex flex-col gap-4 p-0"
      style={{
        paddingBottom: 'calc(var(--tg-content-safe-area-bottom, 0px) + 16px)',
      }}
    >
      {/* Header with Power Up title */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h2 className="m-0 mb-1 text-heading text-white font-bold bg-gradient-to-r from-gold to-orange bg-clip-text text-transparent">
            🚀 Power Up
          </h2>
          <p className="m-0 text-caption text-white/60">
            {activeSection === 'star_packs'
              ? 'Получите Stars и разблокируйте новые возможности'
              : 'Кастомизируйте вашу планету эксклюзивной косметикой'}
          </p>
        </div>
        <button
          onClick={() => {
            loadStarPacks(true);
            loadCosmetics(true);
          }}
          disabled={isStarPacksLoading || isCosmeticsLoading}
          className="flex-shrink-0 p-2.5 rounded-lg hover:bg-white/10 active:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xl focus-ring"
          title="Обновить"
          aria-label="Обновить магазин"
          type="button"
        >
          <span
            className={`inline-block ${isStarPacksLoading || isCosmeticsLoading ? 'animate-spin' : ''}`}
          >
            🔄
          </span>
        </button>
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

      {/* Featured Star Pack Section */}
      {activeSection === 'star_packs' && featuredPack && !isStarPacksLoading && (
        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-r from-gold via-orange to-gold opacity-20 rounded-2xl blur-lg pointer-events-none" />
          <Card
            highlighted
            highlightBadge="✨ ЛУЧШИЙ ВЫБОР"
            className="relative flex gap-4 bg-gradient-to-br from-dark-secondary/80 to-dark-tertiary/80 border-gold/30"
          >
            {/* Icon */}
            <div className="w-[80px] h-[80px] rounded-xl bg-dark-tertiary flex items-center justify-center overflow-hidden border-2 border-gold/40 flex-shrink-0">
              {featuredPack.icon_url ? (
                <OptimizedImage
                  src={featuredPack.icon_url}
                  alt={featuredPack.title}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[32px]" aria-hidden="true">
                  ⭐
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex justify-between items-center gap-2">
                <h3 className="m-0 text-body font-bold text-gold">{featuredPack.title}</h3>
                <Badge variant="warning" size="sm">
                  {featuredPack.stars + (featuredPack.bonus_stars ?? 0)} ⭐ всего
                </Badge>
              </div>
              <p className="m-0 text-caption text-white/80">
                {featuredPack.description ?? `Получите максимум Stars`}
              </p>

              {/* Bundle Breakdown */}
              <div className="bg-dark-tertiary/40 rounded-lg p-3 border border-gold/20 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">
                      ⭐
                    </span>
                    <span className="text-sm text-white/80">Базовых</span>
                  </div>
                  <span className="text-sm font-bold text-gold">{featuredPack.stars}</span>
                </div>
                {(featuredPack.bonus_stars ?? 0) > 0 && (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          ✨
                        </span>
                        <span className="text-sm text-white/80">Бонус</span>
                      </div>
                      <span className="text-sm font-bold text-lime">
                        +{featuredPack.bonus_stars}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">
                          🚀
                        </span>
                        <span className="text-sm text-white/80">Буст</span>
                      </div>
                      <span className="text-sm font-bold text-lime">
                        +
                        {calculateBonusPercentage(
                          featuredPack.stars,
                          featuredPack.bonus_stars ?? 0
                        )}
                        %
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 items-center">
                <div className="text-caption text-gold/80 font-semibold flex-1">
                  {formatPriceLabel(featuredPack.price_rub, featuredPack.price_usd)}
                </div>
                {featuredPack.price_rub && (
                  <div className="text-caption text-gold/70 px-2 py-1 rounded bg-gold/10 border border-gold/20 whitespace-nowrap">
                    {(
                      featuredPack.price_rub /
                      (featuredPack.stars + (featuredPack.bonus_stars ?? 0))
                    ).toFixed(1)}{' '}
                    ₽/⭐
                  </div>
                )}
              </div>
            </div>

            {/* Button */}
            <div className="flex items-center flex-shrink-0">
              <Button
                variant="success"
                size="lg"
                loading={isProcessingStarPackId === featuredPack.id}
                onClick={() => handlePurchaseStarPack(featuredPack.id)}
              >
                Купить
              </Button>
            </div>
          </Card>
        </div>
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
            starPacks
              .filter(pack => !pack.featured)
              .map(pack => {
                const processing = isProcessingStarPackId === pack.id;
                const totalStars = pack.stars + (pack.bonus_stars ?? 0);
                const bonus = pack.bonus_stars ?? 0;
                const priceLabel = formatPriceLabel(pack.price_rub, pack.price_usd);
                const isBestValue = !!(bestValuePack && pack.id === bestValuePack.id);

                return (
                  <Card
                    key={pack.id}
                    highlighted={isBestValue}
                    highlightBadge={isBestValue ? '💰 BEST VALUE' : undefined}
                    className={`flex gap-4 ${isBestValue ? 'bg-gradient-to-br from-dark-secondary/60 to-dark-tertiary/60 border-lime/30' : ''}`}
                  >
                    {/* Icon */}
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
                        <span className="text-[28px]" aria-hidden="true">
                          ⭐
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex justify-between items-center gap-2">
                        <h3
                          className={`m-0 text-body font-semibold ${isBestValue ? 'text-lime' : 'text-white'}`}
                        >
                          {pack.title}
                        </h3>
                        <Badge variant={isBestValue ? 'success' : 'primary'} size="sm">
                          {totalStars} ⭐
                        </Badge>
                      </div>
                      <p className="m-0 text-caption text-white/70">
                        {pack.description ?? `Получите ${totalStars} Stars`}
                      </p>

                      {/* Bundle Breakdown */}
                      <div
                        className={`text-xs space-y-1 rounded px-2 py-1.5 ${isBestValue ? 'bg-lime/10 border border-lime/20' : 'bg-white/5 border border-white/10'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-white/70">⭐ Базовых:</span>
                          <span className={`font-bold ${isBestValue ? 'text-lime' : 'text-gold'}`}>
                            {pack.stars}
                          </span>
                        </div>
                        {bonus > 0 && (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-white/70">✨ Бонус:</span>
                              <span className="font-bold text-lime">+{bonus}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-1">
                              <span className="text-white/70">🚀 Буст:</span>
                              <span className="font-bold text-lime">
                                +{calculateBonusPercentage(pack.stars, bonus)}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 items-center">
                        <div
                          className={`text-caption flex-1 ${isBestValue ? 'text-lime/80 font-semibold' : 'text-white/65'}`}
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
            const isMostPopular = cosmetic.id === mostPopularCosmeticId;

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
              <Card
                key={cosmetic.id}
                highlighted={isMostPopular}
                highlightBadge={isMostPopular ? '⭐ POPULAR' : undefined}
                className={`flex gap-4 ${isMostPopular ? 'bg-gradient-to-br from-dark-secondary/60 to-dark-tertiary/60 border-cyan/30' : ''}`}
              >
                {/* Icon */}
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
                    <span className="text-[28px]" aria-hidden="true">
                      ✦
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <h3
                      className={`m-0 text-body font-semibold ${isMostPopular ? 'text-cyan' : 'text-white'}`}
                    >
                      {cosmetic.name}
                    </h3>
                    <Badge
                      variant={isMostPopular ? 'primary' : rarityMap[cosmetic.rarity] || 'default'}
                      size="sm"
                    >
                      {isMostPopular ? '⭐ Popular' : cosmetic.rarity}
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
