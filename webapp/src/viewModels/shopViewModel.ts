import type { CosmeticItem } from '@/services/cosmetics';
import type { StarPack } from '@/services/starPacks';

export interface ShopViewModelInput {
  cosmetics: CosmeticItem[];
  starPacks: StarPack[];
  activeCategory: string;
}

export interface ShopViewModel {
  categories: { id: string; label: string }[];
  activeCategory: string | null;
  filteredCosmetics: CosmeticItem[];
  bestValuePack: (StarPack & { pricePerStar: number }) | null;
  mostPopularCosmeticId: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  avatar_frame: 'Рамки аватара',
  planet_skin: 'Планеты',
  tap_effect: 'Эффекты тапа',
  background: 'Фоны',
};

const resolveCategoryOptions = (categories: string[]) => {
  return categories.map(category => ({
    id: category,
    label: CATEGORY_LABELS[category] ?? category,
  }));
};

export const buildShopViewModel = ({
  cosmetics,
  starPacks,
  activeCategory,
}: ShopViewModelInput): ShopViewModel => {
  const categoryIds = Array.from(new Set(cosmetics.map(item => item.category)));
  const categories = resolveCategoryOptions(categoryIds);
  const firstCategory = categoryIds[0] ?? null;
  const normalizedCategory =
    activeCategory && categoryIds.includes(activeCategory) ? activeCategory : firstCategory;

  const filteredCosmetics = normalizedCategory
    ? cosmetics.filter(item => item.category === normalizedCategory)
    : cosmetics;

  const regularPacks = starPacks.filter(pack => !pack.featured);
  const bestValuePack =
    regularPacks.length > 0
      ? regularPacks
          .map(pack => ({
            ...pack,
            pricePerStar: pack.price_rub
              ? pack.price_rub / (pack.stars + (pack.bonus_stars ?? 0))
              : Number.POSITIVE_INFINITY,
          }))
          .reduce<(StarPack & { pricePerStar: number }) | null>((best, current) => {
            if (!best || current.pricePerStar < best.pricePerStar) {
              return current;
            }
            return best;
          }, null)
      : null;

  const mostPopularCosmeticId =
    filteredCosmetics.length > 0 ? (filteredCosmetics[0]?.id ?? null) : null;

  return {
    categories,
    activeCategory: normalizedCategory,
    filteredCosmetics,
    bestValuePack,
    mostPopularCosmeticId,
  };
};
