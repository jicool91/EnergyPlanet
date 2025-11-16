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
import { createPurchase, getPurchaseStatus } from '../services/payments';
import { logClientEvent } from '../services/telemetry';
import { useGameStore } from './gameStore';
import { describeError } from './storeUtils';

const PURCHASE_POLL_INTERVAL_MS = 2000;
const PURCHASE_POLL_MAX_MS = 2 * 60 * 1000;

type PurchaseAmount = {
  amountMinor: number;
  currency: string;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function openPaymentLink(url?: string | null): boolean {
  if (!url || typeof window === 'undefined') {
    return false;
  }

  try {
    const webApp = (window as typeof window & { Telegram?: { WebApp?: { openLink?: Function } } })
      .Telegram?.WebApp;
    if (webApp?.openLink) {
      webApp.openLink(url, { try_instant_view: false });
      return true;
    }
  } catch (error) {
    console.warn('Failed to open link via Telegram.WebApp', { url, error });
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return false;
}

function resolvePurchaseAmount(pack: StarPack): PurchaseAmount {
  if (typeof pack.price_rub === 'number' && pack.price_rub > 0) {
    return {
      amountMinor: Math.max(1, Math.round(pack.price_rub * 100)),
      currency: 'RUB',
    };
  }

  if (typeof pack.price_usd === 'number' && pack.price_usd > 0) {
    return {
      amountMinor: Math.max(1, Math.round(pack.price_usd * 100)),
      currency: 'USD',
    };
  }

  const stars = pack.stars + (pack.bonus_stars ?? 0);
  return {
    amountMinor: Math.max(1, stars),
    currency: 'STARS',
  };
}

async function waitForPurchaseCompletion(purchaseId: string, expiresAt?: string | null) {
  const parsedExpiry = expiresAt ? Date.parse(expiresAt) : NaN;
  const expiryDeadline = Number.isNaN(parsedExpiry)
    ? Date.now() + PURCHASE_POLL_MAX_MS
    : Math.max(parsedExpiry + 5000, Date.now() + PURCHASE_POLL_INTERVAL_MS);
  const deadline = Math.max(Date.now() + PURCHASE_POLL_MAX_MS, expiryDeadline);

  while (Date.now() < deadline) {
    const snapshot = await getPurchaseStatus(purchaseId);

    if (snapshot.status === 'succeeded') {
      return snapshot;
    }

    if (snapshot.status === 'failed' || snapshot.status === 'expired') {
      const error = new Error(snapshot.status_reason ?? 'purchase_failed');
      const taggedError = error as unknown as Record<string, unknown>;
      taggedError.status = snapshot.status;
      throw error;
    }

    await delay(PURCHASE_POLL_INTERVAL_MS);
  }

  const error = new Error('purchase_timeout');
  const taggedError = error as unknown as Record<string, unknown>;
  taggedError.status = 'timeout';
  throw error;
}

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
        try {
          await useGameStore.getState().refreshSession();
        } catch (refreshError) {
          console.error('Failed to refresh session after cosmetic purchase', refreshError);
        }
        try {
          await useGameStore.getState().loadProfile(true);
        } catch (profileError) {
          console.error('Failed to refresh profile after cosmetic purchase', profileError);
        }
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
        try {
          await useGameStore.getState().refreshSession();
        } catch (refreshError) {
          console.error('Failed to refresh session after cosmetic equip', refreshError);
        }
        try {
          await useGameStore.getState().loadProfile(true);
        } catch (profileError) {
          console.error('Failed to refresh profile after cosmetic equip', profileError);
        }

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
      const purchaseId = `stars_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const amount = resolvePurchaseAmount(pack);

      set({ isProcessingStarPackId: packId, starPacksError: null });

      try {
        const creation = await createPurchase({
          purchase_id: purchaseId,
          item_id: pack.id,
          purchase_type: 'stars_pack',
          amount_minor: amount.amountMinor,
          currency: amount.currency,
          price_stars: totalStars,
          metadata,
        });

        await logClientEvent(
          'star_pack_purchase_started',
          {
            pack_id: pack.id,
            purchase_id: purchaseId,
            currency: amount.currency,
            amount_minor: amount.amountMinor,
            provider: creation.purchase.provider,
          },
          'info'
        );

        if (creation.provider_payload?.payment_url) {
          openPaymentLink(creation.provider_payload.payment_url);
        } else if (creation.provider_payload?.qr_payload) {
          await logClientEvent('star_pack_purchase_qr_ready', { purchase_id: purchaseId }, 'info');
        }

        const snapshot = await waitForPurchaseCompletion(
          creation.purchase.purchase_id,
          creation.provider_payload?.expires_at ?? null
        );

        await logClientEvent(
          'star_pack_purchase_completed',
          {
            pack_id: pack.id,
            purchase_id: purchaseId,
            status: snapshot.status,
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
            status: (error as Record<string, unknown>)?.status ?? status,
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
