import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { fetchBuildingCatalog, BuildingDefinition } from '../services/buildings';
import {
  completeCosmeticPurchase,
  equipCosmetic as equipCosmeticApi,
  fetchCosmetics,
  unlockCosmetic,
  type CosmeticItem,
} from '../services/cosmetics';
import { fetchStarPacks, type StarPack } from '../services/starPacks';
import { fetchBoostHub, type BoostHubItem, claimBoost as claimBoostApi } from '../services/boosts';
import { apiClient } from '../services/apiClient';
import { logClientEvent } from '../services/telemetry';
import { useGameStore } from './gameStore';
import { describeError } from './storeUtils';

interface CatalogState {
  buildingCatalog: BuildingDefinition[];
  buildingCatalogLoaded: boolean;
  isBuildingCatalogLoading: boolean;

  cosmetics: CosmeticItem[];
  cosmeticsLoaded: boolean;
  isCosmeticsLoading: boolean;
  cosmeticsError: string | null;
  isProcessingCosmeticId: string | null;

  starPacks: StarPack[];
  starPacksLoaded: boolean;
  isStarPacksLoading: boolean;
  starPacksError: string | null;
  isProcessingStarPackId: string | null;

  boostHub: BoostHubItem[];
  boostHubLoaded: boolean;
  isBoostHubLoading: boolean;
  boostHubError: string | null;
  isClaimingBoostType: string | null;
  boostHubTimeOffsetMs: number | null;

  // Actions
  loadBuildingCatalog: (force?: boolean) => Promise<void>;
  loadCosmetics: (force?: boolean) => Promise<void>;
  purchaseCosmetic: (cosmeticId: string) => Promise<void>;
  equipCosmetic: (cosmeticId: string) => Promise<void>;
  loadStarPacks: (force?: boolean) => Promise<void>;
  purchaseStarPack: (packId: string) => Promise<void>;
  loadBoostHub: (force?: boolean) => Promise<void>;
  claimBoost: (boostType: string) => Promise<void>;
}

export const useCatalogStore = create<CatalogState>()(
  subscribeWithSelector((set, get) => ({
    buildingCatalog: [],
    buildingCatalogLoaded: false,
    isBuildingCatalogLoading: false,

    cosmetics: [],
    cosmeticsLoaded: false,
    isCosmeticsLoading: false,
    cosmeticsError: null,
    isProcessingCosmeticId: null,

    starPacks: [],
    starPacksLoaded: false,
    isStarPacksLoading: false,
    starPacksError: null,
    isProcessingStarPackId: null,

    boostHub: [],
    boostHubLoaded: false,
    isBoostHubLoading: false,
    boostHubError: null,
    isClaimingBoostType: null,
    boostHubTimeOffsetMs: null,

    async loadBuildingCatalog(force = false) {
      const { buildingCatalogLoaded, isBuildingCatalogLoading } = get();
      if (!force && (buildingCatalogLoaded || isBuildingCatalogLoading)) {
        return;
      }

      set({ isBuildingCatalogLoading: true });

      try {
        const catalog = await fetchBuildingCatalog();
        set({
          buildingCatalog: catalog,
          buildingCatalogLoaded: true,
          isBuildingCatalogLoading: false,
        });
      } catch (error) {
        console.error('Failed to load building catalog', error);
        set({ isBuildingCatalogLoading: false });
      }
    },

    async loadCosmetics(force = false) {
      const { cosmeticsLoaded, isCosmeticsLoading } = get();
      if (!force && (cosmeticsLoaded || isCosmeticsLoading)) {
        return;
      }

      set({ isCosmeticsLoading: true, cosmeticsError: null });

      try {
        const cosmetics = await fetchCosmetics();
        set({ cosmetics, cosmeticsLoaded: true, isCosmeticsLoading: false, cosmeticsError: null });
      } catch (error) {
        const { message } = describeError(error, 'Не удалось загрузить магазин');
        set({ cosmeticsError: message, isCosmeticsLoading: false });
        await logClientEvent('cosmetics_load_failed', { message, source: 'loadCosmetics' }, 'warn');
      }
    },

    async purchaseCosmetic(cosmeticId: string) {
      const state = get();
      const target = state.cosmetics.find(item => item.id === cosmeticId);
      if (!target) {
        throw new Error('Cosmetic not found');
      }

      if (state.isProcessingCosmeticId === cosmeticId) {
        return;
      }

      set({ isProcessingCosmeticId: cosmeticId });

      try {
        if (target.status === 'purchase_required' && target.price_stars) {
          await completeCosmeticPurchase(target, {
            metadata: { source: 'shop_screen' },
          });
        }

        await unlockCosmetic(cosmeticId);
        await get().loadCosmetics(true);
        await logClientEvent('cosmetic_unlocked', { cosmetic_id: cosmeticId }, 'info');
      } catch (error) {
        const { status, message } = describeError(error, 'Не удалось купить косметику');
        await logClientEvent(
          'cosmetic_purchase_error',
          {
            cosmetic_id: cosmeticId,
            status,
            message,
          },
          'warn'
        );
        set({ cosmeticsError: message });
        throw error;
      } finally {
        set({ isProcessingCosmeticId: null });
      }
    },

    async equipCosmetic(cosmeticId: string) {
      const state = get();
      const target = state.cosmetics.find(item => item.id === cosmeticId);
      if (!target) {
        throw new Error('Cosmetic not found');
      }

      set({ isProcessingCosmeticId: cosmeticId });

      try {
        await equipCosmeticApi(cosmeticId);

        set(storeState => ({
          cosmetics: storeState.cosmetics.map(item => {
            if (item.category !== target.category) {
              return item;
            }

            return {
              ...item,
              equipped: item.id === cosmeticId,
              owned: item.owned || item.id === cosmeticId,
              status: item.id === cosmeticId ? 'owned' : item.status,
            };
          }),
        }));

        await logClientEvent(
          'cosmetic_equipped',
          { cosmetic_id: cosmeticId, category: target.category },
          'info'
        );
      } catch (error) {
        const { status, message } = describeError(error, 'Не удалось экипировать косметику');
        await logClientEvent(
          'cosmetic_equip_error',
          {
            cosmetic_id: cosmeticId,
            status,
            message,
          },
          'warn'
        );
        set({ cosmeticsError: message });
        throw error;
      } finally {
        set({ isProcessingCosmeticId: null });
      }
    },

    async loadStarPacks(force = false) {
      const { starPacksLoaded, isStarPacksLoading } = get();
      if (!force && (starPacksLoaded || isStarPacksLoading)) {
        return;
      }

      set({ isStarPacksLoading: true, starPacksError: null });

      try {
        const packs = await fetchStarPacks();
        set({
          starPacks: packs,
          starPacksLoaded: true,
          isStarPacksLoading: false,
          starPacksError: null,
        });
      } catch (error) {
        const fallbackMessage = 'Не удалось загрузить паки Stars';
        const { message, status } = describeError(error, fallbackMessage);
        set({
          starPacksError: fallbackMessage,
          isStarPacksLoading: false,
        });
        await logClientEvent(
          'star_packs_load_failed',
          { source: 'loadStarPacks', upstream_message: message, status, fallback: fallbackMessage },
          'warn'
        );
      }
    },

    async purchaseStarPack(packId: string) {
      const state = get();
      const pack = state.starPacks.find(item => item.id === packId);
      if (!pack) {
        throw new Error('Star pack not found');
      }

      if (state.isProcessingStarPackId === packId) {
        return;
      }

      const totalStars = pack.stars + (pack.bonus_stars ?? 0);
      const metadata = {
        pack_title: pack.title,
        stars: pack.stars,
        bonus_stars: pack.bonus_stars ?? 0,
        price_usd: pack.price_usd ?? null,
        price_rub: pack.price_rub ?? null,
      };

      set({ isProcessingStarPackId: packId, starPacksError: null });

      const purchaseId = `stars_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const payload = {
        purchase_id: purchaseId,
        item_id: pack.id,
        price_stars: totalStars,
        purchase_type: 'stars_pack' as const,
        metadata,
      };

      try {
        await apiClient.post('/purchase/invoice', payload);
        await apiClient.post('/purchase', payload);

        await logClientEvent(
          'star_pack_purchase_mock',
          {
            pack_id: pack.id,
            total_stars: totalStars,
            purchase_id: purchaseId,
          },
          'info'
        );

        await useGameStore.getState().refreshSession();
      } catch (error) {
        const { status, message } = describeError(error, 'Не удалось завершить покупку Stars');
        await logClientEvent(
          'star_pack_purchase_error',
          {
            pack_id: pack.id,
            status,
            message,
            purchase_id: purchaseId,
          },
          'error'
        );
        set({ starPacksError: message });
        throw error;
      } finally {
        set({ isProcessingStarPackId: null });
      }
    },

    async loadBoostHub(force = false) {
      const { boostHubLoaded, isBoostHubLoading } = get();
      if (!force && (boostHubLoaded || isBoostHubLoading)) {
        return;
      }

      set({ isBoostHubLoading: true, boostHubError: null });

      try {
        const response = await fetchBoostHub();
        const clientReceivedAt = Date.now();
        const serverTimeMs = Date.parse(response.server_time);
        const offsetMs = Number.isNaN(serverTimeMs) ? null : serverTimeMs - clientReceivedAt;
        set({
          boostHub: response.boosts,
          boostHubLoaded: true,
          isBoostHubLoading: false,
          boostHubError: null,
          boostHubTimeOffsetMs: offsetMs,
        });
      } catch (error) {
        const { message } = describeError(error, 'Не удалось загрузить бусты');
        set({ boostHubError: message, isBoostHubLoading: false });
        await logClientEvent('boost_hub_load_failed', { message }, 'warn');
      }
    },

    async claimBoost(boostType: string) {
      const { isClaimingBoostType } = get();
      if (isClaimingBoostType === boostType) {
        return;
      }

      set({ isClaimingBoostType: boostType, boostHubError: null });

      try {
        await logClientEvent('boost_claim_request', { boost_type: boostType }, 'info');
        await claimBoostApi(boostType);
        await logClientEvent('boost_claim_success', { boost_type: boostType }, 'info');
        await get().loadBoostHub(true);
        await useGameStore.getState().refreshSession();
      } catch (error) {
        const { status, message } = describeError(error, 'Не удалось активировать буст');
        await logClientEvent(
          'boost_claim_error',
          {
            boost_type: boostType,
            status,
            message,
          },
          'warn'
        );
        set({ boostHubError: message });
        throw error;
      } finally {
        set({ isClaimingBoostType: null });
      }
    },
  }))
);
