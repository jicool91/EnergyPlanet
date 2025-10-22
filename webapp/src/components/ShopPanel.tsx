import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';

type CategoryOption = {
  id: string;
  label: string;
};

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

export function ShopPanel() {
  const {
    cosmetics,
    cosmeticsLoaded,
    isCosmeticsLoading,
    cosmeticsError,
    isProcessingCosmeticId,
    loadCosmetics,
    purchaseCosmetic,
    equipCosmetic,
  } = useGameStore();

  const [activeCategory, setActiveCategory] = useState<string>('planet_skin');

  useEffect(() => {
    loadCosmetics();
  }, [loadCosmetics]);

  useEffect(() => {
    if (!cosmeticsLoaded && cosmetics.length > 0 && !activeCategory) {
      setActiveCategory(cosmetics[0].category);
    }
  }, [cosmeticsLoaded, cosmetics, activeCategory]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(cosmetics.map(item => item.category)));
    return resolveCategoryOptions(unique);
  }, [cosmetics]);

  useEffect(() => {
    const categoryIds = categories.map(category => category.id);
    if (categoryIds.length === 0) {
      return;
    }

    if (!activeCategory || !categoryIds.includes(activeCategory)) {
      setActiveCategory(categoryIds[0]);
    }
  }, [categories, activeCategory]);

  const filteredCosmetics = useMemo(
    () => cosmetics.filter(item => item.category === activeCategory),
    [cosmetics, activeCategory]
  );

  const handlePurchase = async (cosmeticId: string) => {
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

  return (
    <div className="shop-panel">
      <div className="shop-header">
        <div>
          <h2>Магазин косметики</h2>
          <p className="shop-subtitle">Подберите внешний вид своего мира</p>
        </div>
        <button
          type="button"
          className="shop-refresh"
          onClick={() => loadCosmetics(true)}
          disabled={isCosmeticsLoading}
        >
          {isCosmeticsLoading ? 'Обновление…' : 'Обновить'}
        </button>
      </div>

      {cosmeticsError && <div className="shop-error">{cosmeticsError}</div>}

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

      <div className="shop-grid">
        {isCosmeticsLoading && filteredCosmetics.length === 0 ? (
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
                  onClick={() => handlePurchase(cosmetic.id)}
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
                  onClick={() => handlePurchase(cosmetic.id)}
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
