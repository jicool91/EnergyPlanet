/**
 * Game State Management (Zustand)
 */

import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { apiClient, API_BASE_URL } from '../services/apiClient';
import { postQueue } from '../services/requestQueue';
import { logClientEvent } from '../services/telemetry';
import {
  equipCosmetic as equipCosmeticApi,
  completeCosmeticPurchase,
  fetchCosmetics,
  unlockCosmetic,
  CosmeticItem,
} from '../services/cosmetics';
import { fetchStarPacks, StarPack } from '../services/starPacks';
import { fetchBoostHub, BoostHubItem, claimBoost as claimBoostApi } from '../services/boosts';
import { fetchBuildingCatalog, BuildingDefinition } from '../services/buildings';
import { getTelegramInitData, triggerHapticImpact } from '../services/telegram';
import { authStore } from './authStore';
import { uiStore } from './uiStore';

interface BuildingState {
  buildingId: string;
  name: string;
  count: number;
  level: number;
  incomePerSec: number;
  nextCost: number;
  nextUpgradeCost: number;
}

const STREAK_RESET_MS = 4000;
const STREAK_CRIT_THRESHOLD = 25;

let passiveTicker: ReturnType<typeof setInterval> | null = null;
let passiveFlushTimer: ReturnType<typeof setInterval> | null = null;
let passiveFlushInFlight = false;

interface GameState {
  // User data
  userId: string | null;
  username: string | null;
  level: number;
  xp: number;
  energy: number;
  passiveIncomePerSec: number;
  passiveIncomeMultiplier: number;
  streakCount: number;
  bestStreak: number;
  isCriticalStreak: boolean;
  lastTapAt: number | null;
  pendingPassiveEnergy: number;
  pendingPassiveSeconds: number;
  buildings: BuildingState[];
  buildingsError: string | null;
  isProcessingBuildingId: string | null;
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
  sessionLastSyncedAt: number | null;
  sessionErrorMessage: string | null;

  // Game state
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initGame: () => Promise<void>;
  tap: (count: number) => Promise<void>;
  upgrade: (type: string, itemId: string) => Promise<void>;
  resetStreak: () => void;
  configurePassiveIncome: (perSec: number, multiplier: number) => void;
  refreshSession: () => Promise<void>;
  loadCosmetics: (force?: boolean) => Promise<void>;
  purchaseCosmetic: (cosmeticId: string) => Promise<void>;
  equipCosmetic: (cosmeticId: string) => Promise<void>;
  loadStarPacks: (force?: boolean) => Promise<void>;
  purchaseStarPack: (packId: string) => Promise<void>;
  loadBoostHub: (force?: boolean) => Promise<void>;
  claimBoost: (boostType: string) => Promise<void>;
  purchaseBuilding: (buildingId: string) => Promise<void>;
  upgradeBuilding: (buildingId: string) => Promise<void>;
  flushPassiveIncome: (options?: { keepAlive?: boolean }) => Promise<void>;
  logoutSession: (useKeepAlive?: boolean) => Promise<void>;
  loadBuildingCatalog: (force?: boolean) => Promise<void>;
}

const fallbackSessionError = 'Не удалось обновить данные. Попробуйте ещё раз позже.';

function describeError(error: unknown): { status: number | null; message: string } {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null;
    const upstreamMessage =
      (error.response?.data as { message?: string })?.message || error.message;
    return {
      status,
      message: upstreamMessage,
    };
  }

  if (error instanceof Error) {
    return { status: null, message: error.message };
  }

  return { status: null, message: fallbackSessionError };
}

function mapBuilding(entry: any): BuildingState {
  return {
    buildingId: entry.building_id,
    name: entry.name,
    count: entry.count,
    level: entry.level,
    incomePerSec: entry.income_per_sec,
    nextCost: entry.next_cost,
    nextUpgradeCost: entry.next_upgrade_cost,
  };
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
 userId: null,
  username: null,
  level: 1,
  xp: 0,
  energy: 0,
  passiveIncomePerSec: 0,
  passiveIncomeMultiplier: 1,
  streakCount: 0,
  bestStreak: 0,
  isCriticalStreak: false,
  lastTapAt: null,
  pendingPassiveEnergy: 0,
  pendingPassiveSeconds: 0,
  buildings: [],
  buildingsError: null,
  isProcessingBuildingId: null,
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
  sessionLastSyncedAt: null,
  sessionErrorMessage: null,
  isLoading: true,
  isInitialized: false,

  // Initialize game
  initGame: async () => {
    try {
      uiStore.dismissAuthError();
      set({ isLoading: true, sessionErrorMessage: null });

      // Authenticate with Telegram
      const initData = getTelegramInitData();
      const authResponse = await postQueue.enqueue(() => apiClient.post('/auth/telegram', { initData }));

      // Store tokens
      authStore.setTokens({
        accessToken: authResponse.data.access_token,
        refreshToken: authResponse.data.refresh_token,
      });

      // Start session
      let sessionResponse;
      try {
        sessionResponse = await postQueue.enqueue(() => apiClient.post('/session'));
      } catch (sessionError) {
        const { status, message } = describeError(sessionError);
        set({ sessionErrorMessage: message || fallbackSessionError });

        await logClientEvent(
          'offline_income_error',
          {
            status,
            message,
            source: 'initGame',
          },
          status && status >= 500 ? 'error' : 'warn'
        );

        throw sessionError;
      }
      const { user, progress, offline_gains: offlineGains, inventory } = sessionResponse.data;
      const passivePerSec = progress.passive_income_per_sec ?? 0;
      const passiveMultiplier = progress.passive_income_multiplier ?? 1;
      const buildings = Array.isArray(inventory) ? inventory.map(mapBuilding) : [];

      const offlineSummary =
        offlineGains && offlineGains.energy > 0
          ? {
              energy: offlineGains.energy,
              xp: offlineGains.xp ?? 0,
              duration_sec: offlineGains.duration_sec,
              capped: offlineGains.capped,
            }
          : null;

      uiStore.setOfflineSummary(offlineSummary);

      set({
        userId: user.id,
        username: user.username,
        level: progress.level,
        xp: progress.xp,
        energy: progress.energy,
        passiveIncomePerSec: passivePerSec,
        passiveIncomeMultiplier: passiveMultiplier,
        streakCount: 0,
        bestStreak: 0,
        isCriticalStreak: false,
        lastTapAt: Date.now(),
        buildings,
        buildingsError: null,
        pendingPassiveEnergy: 0,
        isInitialized: true,
        isLoading: false,
        sessionLastSyncedAt: Date.now(),
        sessionErrorMessage: null,
      });

      get().configurePassiveIncome(passivePerSec, passiveMultiplier);
    } catch (error) {
      console.error('Failed to initialize game', error);

      const fallbackMessage = 'Не удалось авторизоваться. Проверьте подключение и попробуйте ещё раз.';
      let message = fallbackMessage;

      if (isAxiosError(error)) {
        const status = error.response?.status;
        const upstreamMessage =
          (error.response?.data as { message?: string })?.message || error.message;

        if (status === 401) {
          message = 'Телеграм сессия недействительна. Закройте и заново откройте мини-приложение.';
        } else if (status === 400) {
          message = 'От клиента пришли некорректные данные авторизации. Проверьте initData.';
        } else if (status) {
          message = `Ошибка ${status}: ${upstreamMessage}`;
        } else {
          message = upstreamMessage;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }

      uiStore.openAuthError(message);
      set(state => ({
        isLoading: false,
        sessionErrorMessage: state.sessionErrorMessage ?? message,
      }));
    }
  },

  // Handle tap
  tap: async (count: number) => {
    try {
      await get().flushPassiveIncome();
      const response = await apiClient.post('/tap', { tap_count: count });
      const {
        energy: serverEnergy,
        energy_gained: energyGained = 0,
        xp_gained,
        level,
        level_up,
      } = response.data;

      const previousStreak = get().streakCount;
      const newStreak = previousStreak + count;
      const isCritical = newStreak > 0 && newStreak % STREAK_CRIT_THRESHOLD === 0;

      triggerHapticImpact(isCritical ? 'heavy' : 'light');

      set(state => ({
        energy: Math.max(
          serverEnergy + state.pendingPassiveEnergy,
          state.energy + energyGained
        ),
        level,
        xp: state.xp + xp_gained,
        streakCount: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        isCriticalStreak: isCritical,
        lastTapAt: Date.now(),
      }));

      if (level_up) {
        // Show level up notification
        console.log('Level up!');
      }
    } catch (error) {
      console.error('Tap failed', error);
    }
  },

  // Handle upgrade
  upgrade: async (type: string, itemId: string) => {
    try {
      const response = await apiClient.post('/upgrade', {
        upgrade_type: type,
        item_id: itemId,
      });

      set({
        energy: response.data.energy,
        level: response.data.level,
      });

      await get().refreshSession();
    } catch (error) {
      console.error('Upgrade failed', error);
      throw error;
    }
  },

 resetStreak: () => {
    if (get().streakCount === 0) {
      return;
    }
    set({ streakCount: 0, isCriticalStreak: false });
  },

  configurePassiveIncome: (perSec: number, multiplier: number) => {
    const flushPassiveIncome = get().flushPassiveIncome;

    set({ passiveIncomePerSec: perSec, passiveIncomeMultiplier: multiplier });

    if (passiveTicker) {
      clearInterval(passiveTicker);
      passiveTicker = null;
    }

    if (passiveFlushTimer) {
      clearInterval(passiveFlushTimer);
      passiveFlushTimer = null;
    }

    if (perSec > 0) {
      passiveTicker = setInterval(() => {
        set(state => ({
          energy: state.energy + perSec,
          pendingPassiveEnergy: state.pendingPassiveEnergy + perSec,
          pendingPassiveSeconds: state.pendingPassiveSeconds + 1,
        }));
      }, 1000);

      passiveFlushTimer = setInterval(() => {
        flushPassiveIncome().catch(error => {
          console.warn('Failed to flush passive income', error);
        });
      }, 15000);
    }
  },

  refreshSession: async () => {
    try {
      const response = await apiClient.post('/session');
      const { user, progress, offline_gains: offlineGains, inventory } = response.data;
      const buildings = Array.isArray(inventory) ? inventory.map(mapBuilding) : [];

      const offlineSummary =
        offlineGains && offlineGains.energy > 0
          ? {
              energy: offlineGains.energy,
              xp: offlineGains.xp ?? 0,
              duration_sec: offlineGains.duration_sec,
              capped: offlineGains.capped,
            }
          : null;

      uiStore.setOfflineSummary(offlineSummary);

      set({
        userId: user.id,
        username: user.username,
        level: progress.level,
        xp: progress.xp,
        energy: progress.energy,
        lastTapAt: Date.now(),
        buildings,
        buildingsError: null,
        pendingPassiveEnergy: 0,
        pendingPassiveSeconds: 0,
        sessionLastSyncedAt: Date.now(),
        sessionErrorMessage: null,
      });

      const passivePerSec = progress.passive_income_per_sec ?? 0;
      const passiveMultiplier = progress.passive_income_multiplier ?? 1;
      get().configurePassiveIncome(passivePerSec, passiveMultiplier);
    } catch (error) {
      console.error('Failed to refresh session snapshot', error);

      const { status, message } = describeError(error);
      set({ sessionErrorMessage: message || fallbackSessionError });

      await logClientEvent(
        'offline_income_error',
        {
          status,
          message,
          source: 'refreshSession',
        },
        status && status >= 500 ? 'error' : 'warn'
      );
    }
  },

  loadCosmetics: async (force = false) => {
    const { cosmeticsLoaded, isCosmeticsLoading } = get();
    if (!force && (cosmeticsLoaded || isCosmeticsLoading)) {
      return;
    }

    set({ isCosmeticsLoading: true, cosmeticsError: null });

    try {
      const cosmetics = await fetchCosmetics();
      set({ cosmetics, cosmeticsLoaded: true, isCosmeticsLoading: false, cosmeticsError: null });
    } catch (error) {
      const { message } = describeError(error);
      set({ cosmeticsError: message || 'Не удалось загрузить магазин', isCosmeticsLoading: false });
      await logClientEvent(
        'cosmetics_load_failed',
        { message, source: 'loadCosmetics' },
        'warn'
      );
    }
  },

  purchaseCosmetic: async (cosmeticId: string) => {
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
      const { status, message } = describeError(error);
      await logClientEvent(
        'cosmetic_purchase_error',
        {
          cosmetic_id: cosmeticId,
          status,
          message,
        },
        'warn'
      );
      set({ cosmeticsError: message || 'Не удалось купить косметику' });
      throw error;
    } finally {
      set({ isProcessingCosmeticId: null });
    }
  },

  equipCosmetic: async (cosmeticId: string) => {
    const { cosmetics } = get();
    const target = cosmetics.find(item => item.id === cosmeticId);
    if (!target) {
      throw new Error('Cosmetic not found');
    }

    set({ isProcessingCosmeticId: cosmeticId });

    try {
      await equipCosmeticApi(cosmeticId);

      set(state => ({
        cosmetics: state.cosmetics.map(item => {
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

      await logClientEvent('cosmetic_equipped', { cosmetic_id: cosmeticId, category: target.category }, 'info');
    } catch (error) {
      const { status, message } = describeError(error);
      await logClientEvent(
        'cosmetic_equip_error',
        {
          cosmetic_id: cosmeticId,
          status,
          message,
        },
        'warn'
      );
      set({ cosmeticsError: message || 'Не удалось экипировать косметику' });
      throw error;
    } finally {
      set({ isProcessingCosmeticId: null });
    }
  },

  loadStarPacks: async (force = false) => {
    const { starPacksLoaded, isStarPacksLoading } = get();
    if (!force && (starPacksLoaded || isStarPacksLoading)) {
      return;
    }

    set({ isStarPacksLoading: true, starPacksError: null });

    try {
      const packs = await fetchStarPacks();
      set({ starPacks: packs, starPacksLoaded: true, isStarPacksLoading: false, starPacksError: null });
    } catch (error) {
      const { message } = describeError(error);
      set({ starPacksError: message || 'Не удалось загрузить паки Stars', isStarPacksLoading: false });
      await logClientEvent(
        'star_packs_load_failed',
        { message, source: 'loadStarPacks' },
        'warn'
      );
    }
  },

  purchaseStarPack: async (packId: string) => {
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

      await get().refreshSession();
    } catch (error) {
      const { status, message } = describeError(error);
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
      set({ starPacksError: message || 'Не удалось завершить покупку Stars' });
      throw error;
    } finally {
      set({ isProcessingStarPackId: null });
    }
  },

  loadBoostHub: async (force = false) => {
    const { boostHubLoaded, isBoostHubLoading } = get();
    if (!force && (boostHubLoaded || isBoostHubLoading)) {
      return;
    }

    set({ isBoostHubLoading: true, boostHubError: null });

    try {
      const response = await fetchBoostHub();
      set({
        boostHub: response.boosts,
        boostHubLoaded: true,
        isBoostHubLoading: false,
        boostHubError: null,
      });
    } catch (error) {
      const { message } = describeError(error);
      set({ boostHubError: message || 'Не удалось загрузить бусты', isBoostHubLoading: false });
      await logClientEvent(
        'boost_hub_load_failed',
        { message },
        'warn'
      );
    }
  },

  claimBoost: async (boostType: string) => {
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
      await get().refreshSession();
    } catch (error) {
      const { status, message } = describeError(error);
      await logClientEvent(
        'boost_claim_error',
        {
          boost_type: boostType,
          status,
          message,
        },
        'warn'
      );
      set({ boostHubError: message || 'Не удалось активировать буст' });
      throw error;
    } finally {
      set({ isClaimingBoostType: null });
    }
  },

  flushPassiveIncome: async ({ keepAlive = false }: { keepAlive?: boolean } = {}) => {
    const pendingSeconds = get().pendingPassiveSeconds;
    if (!pendingSeconds || pendingSeconds <= 0 || passiveFlushInFlight) {
      return;
    }

    try {
      passiveFlushInFlight = true;
      let payload: any;

      if (keepAlive) {
        const headers = authStore.getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}/tick`, {
          method: 'POST',
          body: JSON.stringify({ time_delta: pendingSeconds }),
          headers,
          keepalive: true,
        });

        if (!response.ok) {
          throw new Error(`Tick sync failed (${response.status})`);
        }
        payload = await response.json();
      } else {
        const response = await apiClient.post('/tick', { time_delta: pendingSeconds });
        payload = response.data;
      }

      const passivePerSec = payload.passive_income_per_sec ?? get().passiveIncomePerSec;
      const passiveMultiplier = get().passiveIncomeMultiplier;

      set(state => ({
        energy: payload.energy,
        level: payload.level,
        xp: state.xp + (payload.xp_gained ?? 0),
        pendingPassiveEnergy: 0,
        pendingPassiveSeconds: 0,
        passiveIncomePerSec: passivePerSec,
        passiveIncomeMultiplier: passiveMultiplier,
        sessionLastSyncedAt: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to sync passive income', error);
    } finally {
      passiveFlushInFlight = false;
    }
  },

  purchaseBuilding: async (buildingId: string) => {
    if (!buildingId) {
      return;
    }

    set({ isProcessingBuildingId: buildingId, buildingsError: null });

    try {
      await get().flushPassiveIncome();
      await logClientEvent('building_purchase_request', { building_id: buildingId }, 'info');

      const response = await apiClient.post('/upgrade', {
        building_id: buildingId,
        action: 'purchase',
      });

      await logClientEvent('building_purchase_success', {
        building_id: buildingId,
        cost: response.data?.building?.next_cost ?? null,
      });

      await get().refreshSession();
    } catch (error) {
      const { status, message } = describeError(error);
      await logClientEvent(
        'building_purchase_error',
        {
          building_id: buildingId,
          status,
          message,
        },
        'warn'
      );
      set({ buildingsError: message || 'Не удалось купить постройку' });
      throw error;
    } finally {
      set({ isProcessingBuildingId: null });
    }
  },

  upgradeBuilding: async (buildingId: string) => {
    if (!buildingId) {
      return;
    }

    set({ isProcessingBuildingId: buildingId, buildingsError: null });

    try {
      await get().flushPassiveIncome();
      await logClientEvent('building_upgrade_request', { building_id: buildingId }, 'info');

      await apiClient.post('/upgrade', {
        building_id: buildingId,
        action: 'upgrade',
      });

      await logClientEvent('building_upgrade_success', { building_id: buildingId }, 'info');

      await get().refreshSession();
    } catch (error) {
      const { status, message } = describeError(error);
      await logClientEvent(
        'building_upgrade_error',
        {
          building_id: buildingId,
          status,
          message,
        },
        'warn'
      );
      set({ buildingsError: message || 'Не удалось улучшить постройку' });
      throw error;
    } finally {
      set({ isProcessingBuildingId: null });
    }
  },

  logoutSession: async (useKeepAlive = true) => {
    try {
      await get().flushPassiveIncome({ keepAlive: useKeepAlive });
      const headers = authStore.getAuthHeaders();

      const body = JSON.stringify({});

      await fetch(`${API_BASE_URL}/session/logout`, {
        method: 'POST',
        body,
        headers,
        keepalive: useKeepAlive,
      });
    } catch (error) {
      console.warn('Failed to send logout event', error);
    } finally {
      set({ pendingPassiveSeconds: 0, pendingPassiveEnergy: 0 });
    }
  },

  loadBuildingCatalog: async (force = false) => {
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
}));

export const streakConfig = {
  resetMs: STREAK_RESET_MS,
  criticalThreshold: STREAK_CRIT_THRESHOLD,
};
