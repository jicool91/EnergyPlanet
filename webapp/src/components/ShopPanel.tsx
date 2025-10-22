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
    <div className="flex flex-col gap-4 p-0">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="m-0 mb-1 text-xl text-[#f8fbff]">Магазин</h2>
          <p className="m-0 text-[13px] text-white/60">Покупайте Stars и кастомизируйте планету</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-md border-0 bg-cyan/[0.18] text-[#f8fbff] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px hover:enabled:shadow-[0_8px_18px_rgba(0,217,255,0.25)] disabled:opacity-50 disabled:cursor-default"
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

      <div className="flex gap-2 p-0">
        {SECTION_TABS.map(section => (
          <button
            key={section.id}
            type="button"
            className={`px-4 py-2 rounded-md border border-cyan/[0.12] bg-dark-secondary/60 text-white/70 text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out ${activeSection === section.id ? 'bg-gradient-to-br from-cyan/25 to-[rgba(38,127,255,0.28)] text-[#f8fbff] shadow-[0_10px_24px_rgba(0,217,255,0.25)] border-cyan/[0.35]' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'star_packs' && starPacksError && <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px]">{starPacksError}</div>}
      {activeSection === 'cosmetics' && cosmeticsError && <div className="px-4 py-3 bg-red-error/[0.15] border border-red-error/40 text-[#ffb8b8] rounded-md text-[13px]">{cosmeticsError}</div>}

      {activeSection === 'cosmetics' && (
        <div className="flex gap-2 flex-wrap p-0">
          {categories.length === 0 && !isCosmeticsLoading && (
            <span className="text-white/60 text-[13px]">Пока нет косметики для отображения</span>
          )}

          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={`px-[14px] py-2 rounded-full border border-cyan/[0.18] bg-dark-secondary/60 text-white/75 text-[13px] cursor-pointer transition-all duration-[120ms] ease-in-out disabled:opacity-60 disabled:cursor-default ${category.id === activeCategory ? 'bg-gradient-to-br from-cyan/25 to-[rgba(38,127,255,0.28)] text-[#f8fbff] border-cyan/[0.35]' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              disabled={isCosmeticsLoading && category.id !== activeCategory}
            >
              {category.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 p-0">
        {activeSection === 'star_packs' ? (
          isStarPacksLoading && starPacks.length === 0 ? (
            <div className="p-6 text-center text-white/70 text-sm">Получаем паки Stars…</div>
          ) : (
            starPacks.map(pack => {
              const processing = isProcessingStarPackId === pack.id;
              const totalStars = pack.stars + (pack.bonus_stars ?? 0);
              const bonus = pack.bonus_stars ?? 0;
              const priceLabel = formatPriceLabel(pack.price_rub, pack.price_usd);

              return (
                <div key={pack.id} className={`flex gap-4 p-4 rounded-lg bg-[rgba(10,14,32,0.9)] border border-cyan/[0.12] shadow-[0_18px_40px_rgba(7,12,35,0.4)] ${pack.featured ? 'border-[rgba(255,193,77,0.5)] shadow-[0_22px_48px_rgba(255,193,77,0.3)] bg-gradient-to-br from-[rgba(28,20,52,0.95)] to-[rgba(64,38,72,0.95)]' : ''}`}>
                  <div className="w-[72px] h-[72px] rounded-[18px] bg-[rgba(15,24,52,0.85)] flex items-center justify-center overflow-hidden border border-cyan/10">
                    {pack.icon_url ? (
                      <img src={pack.icon_url} alt={pack.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[28px]" aria-hidden="true">
                        ⭐
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-[6px]">
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="m-0 text-base text-[#f8fbff]">{pack.title}</h3>
                      <span className="px-2 py-[2px] rounded-full text-[11px] uppercase tracking-[0.8px] bg-[rgba(78,159,255,0.2)] text-[#7bb7ff]">Stars</span>
                    </div>
                    <p className="m-0 text-[13px] text-white/70">{pack.description ?? `Получите ${totalStars} Stars`}</p>
                    <div className="text-[13px] text-white/65">{priceLabel}</div>
                    <div className="flex gap-3 text-xs text-white/70">
                      <span className="font-semibold">{totalStars} ⭐ всего</span>
                      {bonus > 0 && <span className="text-[#ffd27d] font-semibold">+{bonus} бонус</span>}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      className="px-[18px] py-[10px] rounded-md border-0 bg-gradient-to-br from-[#ffd362] to-orange text-[#1e0f05] shadow-[0_12px_30px_rgba(255,141,77,0.35)] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px disabled:opacity-60 disabled:cursor-default disabled:shadow-none"
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
          <div className="p-6 text-center text-white/70 text-sm">Загрузка ассортимента…</div>
        ) : (
          filteredCosmetics.map(cosmetic => {
            const processing = isProcessingCosmeticId === cosmetic.id;
            const price = cosmetic.price_stars ?? 0;

            let actionButton: JSX.Element | null = null;

            if (cosmetic.equipped) {
              actionButton = (
                <button className="px-[18px] py-[10px] rounded-md border-0 bg-[rgba(92,255,145,0.18)] text-[#75ffb1] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out disabled:opacity-60 disabled:cursor-default disabled:shadow-none" type="button" disabled>
                  Экипировано
                </button>
              );
            } else if (cosmetic.owned) {
              actionButton = (
                <button
                  className="px-[18px] py-[10px] rounded-md border-0 bg-cyan/[0.22] text-[#f8fbff] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px disabled:opacity-60 disabled:cursor-default disabled:shadow-none"
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
                  className="px-[18px] py-[10px] rounded-md border-0 bg-gradient-to-br from-[#ffd362] to-orange text-[#1e0f05] shadow-[0_12px_30px_rgba(255,141,77,0.35)] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px disabled:opacity-60 disabled:cursor-default disabled:shadow-none"
                  type="button"
                  onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                  disabled={processing}
                >
                  {processing ? 'Покупка…' : `Купить за ${price} ⭐`}
                </button>
              );
            } else if (cosmetic.status === 'locked' && cosmetic.unlock_requirement?.level) {
              actionButton = (
                <div className="text-xs text-white/60">Откроется с {cosmetic.unlock_requirement.level} уровня</div>
              );
            } else if (cosmetic.status === 'event_locked') {
              actionButton = <div className="text-xs text-white/60">Доступно на событии</div>;
            } else {
              actionButton = (
                <button
                  className="px-[18px] py-[10px] rounded-md border-0 bg-cyan/[0.22] text-[#f8fbff] text-[13px] font-semibold cursor-pointer transition-all duration-[120ms] ease-in-out hover:enabled:-translate-y-px disabled:opacity-60 disabled:cursor-default disabled:shadow-none"
                  type="button"
                  onClick={() => handlePurchaseCosmetic(cosmetic.id)}
                  disabled={processing}
                >
                  {processing ? 'Загрузка…' : 'Получить'}
                </button>
              );
            }

            const rarityClasses = {
              common: 'bg-white/[0.12] text-white/75',
              rare: 'bg-[rgba(78,159,255,0.2)] text-[#7bb7ff]',
              epic: 'bg-[rgba(180,84,255,0.2)] text-[#d2a6ff]',
              legendary: 'bg-[rgba(255,193,77,0.25)] text-[#ffd27d]'
            };

            return (
              <div key={cosmetic.id} className="flex gap-4 p-4 rounded-lg bg-[rgba(10,14,32,0.9)] border border-cyan/[0.12] shadow-[0_18px_40px_rgba(7,12,35,0.4)]">
                <div className="w-[72px] h-[72px] rounded-[18px] bg-[rgba(15,24,52,0.85)] flex items-center justify-center overflow-hidden border border-cyan/10">
                  {cosmetic.preview_url ? (
                    <img src={cosmetic.preview_url} alt={cosmetic.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[28px]" aria-hidden="true">
                      ✦
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-[6px]">
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="m-0 text-base text-[#f8fbff]">{cosmetic.name}</h3>
                    <span className={`px-2 py-[2px] rounded-full text-[11px] uppercase tracking-[0.8px] ${rarityClasses[cosmetic.rarity as keyof typeof rarityClasses] || rarityClasses.common}`}>{cosmetic.rarity}</span>
                  </div>
                  <p className="m-0 text-[13px] text-white/70">{cosmetic.description}</p>
                  {price > 0 && cosmetic.status !== 'owned' && (
                    <div className="text-[13px] text-white/65">Стоимость: {price} ⭐</div>
                  )}
                </div>
                <div className="flex items-center">{actionButton}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
