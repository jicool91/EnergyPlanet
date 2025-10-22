import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';

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
    <div className="shop-panel">
      <div className="shop-header">
        <div>
          <h2>Магазин</h2>
          <p className="shop-subtitle">Покупайте Stars и кастомизируйте планету</p>
        </div>
        <div className="shop-header-actions">
          <button
            type="button"
            className="shop-refresh"
            onClick={() => {
              loadStarPacks(true);
              loadCosmetics(true);
            }}
            disabled={isStarPacksLoading || isCosmeticsLoading}
          >
            {isStarPacksLoading || isCosmeticsLoading ? 'Обновление…' : 'Обновить'}
          </button>
        </div>
      </div>

      <div className="shop-section-tabs">
        {SECTION_TABS.map(section => (
          <button
            key={section.id}
            type="button"
            className={`shop-section-tab${activeSection === section.id ? ' active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'star_packs' && starPacksError && <div className="shop-error">{starPacksError}</div>}
      {activeSection === 'cosmetics' && cosmeticsError && <div className="shop-error">{cosmeticsError}</div>}

      {activeSection === 'cosmetics' && (
        <div className="shop-categories">
          {categories.length === 0 && !isCosmeticsLoading && (
            <span className="shop-empty">Пока нет косметики для отображения</span>
          )}

          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={`shop-category${category.id === activeCategory ? ' active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              disabled={isCosmeticsLoading && category.id !== activeCategory}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      <div className="shop-grid">
        {activeSection === 'star_packs' ? (
          isStarPacksLoading && starPacks.length === 0 ? (
            <div className="shop-loader">Получаем паки Stars…</div>
          ) : (
            starPacks.map(pack => {
              const processing = isProcessingStarPackId === pack.id;
              const totalStars = pack.stars + (pack.bonus_stars ?? 0);
              const bonus = pack.bonus_stars ?? 0;
              const priceLabel = formatPriceLabel(pack.price_rub, pack.price_usd);

              return (
                <div key={pack.id} className={`shop-card${pack.featured ? ' shop-card-featured' : ''}`}>
                  <div className="shop-preview">
                    {pack.icon_url ? (
                      <img src={pack.icon_url} alt={pack.title} />
                    ) : (
                      <span className="shop-preview-placeholder" aria-hidden="true">
                        ⭐
                      </span>
                    )}
                  </div>
                  <div className="shop-info">
                    <div className="shop-title-row">
                      <h3>{pack.title}</h3>
                      <span className="rarity-tag rarity-rare">Stars</span>
                    </div>
                    <p className="shop-description">{pack.description ?? `Получите ${totalStars} Stars`}</p>
                    <div className="shop-price">{priceLabel}</div>
                    <div className="shop-stars-breakdown">
                      <span className="shop-stars-total">{totalStars} ⭐ всего</span>
                      {bonus > 0 && <span className="shop-stars-bonus">+{bonus} бонус</span>}
                    </div>
                  </div>
                  <div className="shop-action">
                    <button
                      className="shop-button accent"
                      type="button"
                      onClick={() => handlePurchaseStarPack(pack.id)}
                      disabled={processing}
                    >
                      {processing ? 'Ожидание…' : 'Купить Stars'}
                    </button>
                  </div>
                </div>
              );
            })
          )
        ) : isCosmeticsLoading && filteredCosmetics.length === 0 ? (
          <div className="shop-loader">Загрузка ассортимента…</div>
        ) : (
          filteredCosmetics.map(cosmetic => {
            const processing = isProcessingCosmeticId === cosmetic.id;
            const price = cosmetic.price_stars ?? 0;

            let actionButton: JSX.Element | null = null;

            if (cosmetic.equipped) {
              actionButton = (
                <button className="shop-button equipped" type="button" disabled>
                  Экипировано
                </button>
              );
            } else if (cosmetic.owned) {
              actionButton = (
                <button
                  className="shop-button primary"
                  type="button"
                  onClick={() => handleEquip(cosmetic.id)}
                  disabled={processing}
                >
                  {processing ? 'Экипирование…' : 'Экипировать'}
                </button>
              );
            } else if (cosmetic.status === 'purchase_required' && price > 0) {
              actionButton = (
                <button
                  className="shop-button accent"
                  type="button"
                  onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                  disabled={processing}
                >
                  {processing ? 'Покупка…' : `Купить за ${price} ⭐`}
                </button>
              );
            } else if (cosmetic.status === 'locked' && cosmetic.unlock_requirement?.level) {
              actionButton = (
                <div className="shop-locked">Откроется с {cosmetic.unlock_requirement.level} уровня</div>
              );
            } else if (cosmetic.status === 'event_locked') {
              actionButton = <div className="shop-locked">Доступно на событии</div>;
            } else {
              actionButton = (
                <button
                  className="shop-button primary"
                  type="button"
                  onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                  disabled={processing}
                >
                  {processing ? 'Загрузка…' : 'Получить'}
                </button>
              );
            }

            return (
              <div key={cosmetic.id} className="shop-card">
                <div className="shop-preview">
                  {cosmetic.preview_url ? (
                    <img src={cosmetic.preview_url} alt={cosmetic.name} />
                  ) : (
                    <span className="shop-preview-placeholder" aria-hidden="true">
                      ✦
                    </span>
                  )}
                </div>
                <div className="shop-info">
                  <div className="shop-title-row">
                    <h3>{cosmetic.name}</h3>
                    <span className={`rarity-tag rarity-${cosmetic.rarity}`}>{cosmetic.rarity}</span>
                  </div>
                  <p className="shop-description">{cosmetic.description}</p>
                  {price > 0 && cosmetic.status !== 'owned' && (
                    <div className="shop-price">Стоимость: {price} ⭐</div>
                  )}
                </div>
                <div className="shop-action">{actionButton}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
