/**
 * Game State Management (Zustand)
 */

import { create } from 'zustand';
import type { StoreApi } from 'zustand';
import { isAxiosError } from 'axios';
import { apiClient, API_BASE_URL } from '../services/apiClient';
import { postQueue } from '../services/requestQueue';
import { logClientEvent } from '../services/telemetry';
import { logger } from '../utils/logger';
import { triggerHapticImpact } from '@/services/tma/haptics';
import { fetchLeaderboard, LeaderboardUserEntry } from '../services/leaderboard';
import { fetchProfile, ProfileResponse } from '../services/profile';
import { describeError } from './storeUtils';
import { authStore } from './authStore';
import { uiStore } from './uiStore';
import { fetchPrestigeStatus, performPrestigeReset } from '../services/prestige';
import {
  fetchAchievements,
  claimAchievement as claimAchievementApi,
  type AchievementView,
} from '../services/achievements';

interface BuildingState {
  buildingId: string;
  name: string;
  count: number;
  level: number;
  incomePerSec: number;
  nextCost: number;
  nextUpgradeCost: number;
}

interface InventoryBuildingPayload {
  building_id: string;
  name: string;
  count: number;
  level: number;
  income_per_sec: number;
  next_cost: number;
  next_upgrade_cost: number;
}

interface TickSyncResponse {
  energy: number;
  level: number;
  xp_gained?: number;
  xp_into_level?: number;
  xp_to_next_level?: number;
  passive_income_per_sec?: number;
  passive_income_multiplier?: number;
  boost_multiplier?: number;
  prestige_multiplier?: number;
  achievement_multiplier?: number;
  access_token?: string;
  refresh_token?: string;
  refresh_expires_at?: string;
  expires_in?: number;
  pending_passive_sec?: number;
}

interface UpgradeResponsePayload {
  energy?: number;
  level?: number;
  xp_gained?: number;
  xp_into_level?: number;
  xp_to_next_level?: number;
  purchased?: number;
  building?: {
    building_id: string;
    count: number;
    level: number;
    income_per_sec: number;
    next_cost: number;
    next_upgrade_cost: number;
  };
}

const STREAK_RESET_MS = 4000;
const STREAK_CRIT_THRESHOLD = 25;

let passiveTicker: ReturnType<typeof setInterval> | null = null;
let passiveFlushTimer: ReturnType<typeof setInterval> | null = null;
let passiveFlushInFlight = false;
const PASSIVE_TICK_INTERVAL_MS = 250;
const PASSIVE_COMMIT_INTERVAL_MS = 350;
let passiveEnergyUiBuffer = 0;
let passiveSecondsUiBuffer = 0;
let lastPassiveUiCommit = 0;

const commitPassiveBuffers = (set: StoreApi<GameState>['setState']) => {
  if (passiveEnergyUiBuffer === 0 && passiveSecondsUiBuffer === 0) {
    return;
  }

  set(state => ({
    energy: state.energy + passiveEnergyUiBuffer,
    pendingPassiveEnergy: state.pendingPassiveEnergy + passiveEnergyUiBuffer,
    pendingPassiveSeconds: state.pendingPassiveSeconds + passiveSecondsUiBuffer,
  }));

  passiveEnergyUiBuffer = 0;
  passiveSecondsUiBuffer = 0;
  lastPassiveUiCommit = Date.now();
};

const queuePassiveUpdate = (
  set: StoreApi<GameState>['setState'],
  energyDelta: number,
  secondsDelta: number
) => {
  passiveEnergyUiBuffer += energyDelta;
  passiveSecondsUiBuffer += secondsDelta;

  const now = Date.now();
  if (now - lastPassiveUiCommit >= PASSIVE_COMMIT_INTERVAL_MS) {
    commitPassiveBuffers(set);
  }
};

const resetPassiveBuffers = () => {
  passiveEnergyUiBuffer = 0;
  passiveSecondsUiBuffer = 0;
  lastPassiveUiCommit = Date.now();
};

interface GameState {
  // User data
  userId: string | null;
  username: string | null;
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  tapLevel: number;
  tapIncome: number;
  energy: number;
  stars: number; // ⭐ Player's star balance
  passiveIncomePerSec: number;
  passiveIncomeMultiplier: number;
  boostMultiplier: number;
  prestigeMultiplier: number;
  achievementMultiplier: number;
  prestigeLevel: number;
  prestigeEnergySinceReset: number;
  prestigeLastReset: string | null;
  prestigeNextThreshold: number;
  prestigeEnergyToNext: number;
  prestigeGainAvailable: number;
  isPrestigeAvailable: boolean;
  isPrestigeLoading: boolean;
  prestigeStatusLoaded: boolean;
  streakCount: number;
  bestStreak: number;
  isCriticalStreak: boolean;
  lastTapAt: number | null;
  pendingPassiveEnergy: number;
  pendingPassiveSeconds: number;
  buildings: BuildingState[];
  buildingsError: string | null;
  isProcessingBuildingId: string | null;
  sessionLastSyncedAt: number | null;
  sessionErrorMessage: string | null;
  leaderboardEntries: LeaderboardUserEntry[];
  leaderboardLoaded: boolean;
  isLeaderboardLoading: boolean;
  leaderboardError: string | null;
  leaderboardTotal: number;
  userLeaderboardEntry: LeaderboardUserEntry | null;
  profile: ProfileResponse | null;
  profileBoosts: ProfileResponse['boosts'];
  isProfileLoading: boolean;
  profileError: string | null;
  achievements: AchievementView[];
  achievementsLoaded: boolean;
  achievementsLoading: boolean;
  achievementsError: string | null;
  claimingAchievementSlug: string | null;

  // Game state
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initGame: () => Promise<void>;
  tap: (count: number) => Promise<void>;
  upgrade: (type: string, itemId: string) => Promise<void>;
  resetStreak: () => void;
  configurePassiveIncome: (
    perSec: number,
    totalMultiplier: number,
    extras?: {
      boostMultiplier?: number;
      prestigeMultiplier?: number;
      achievementMultiplier?: number;
    }
  ) => void;
  refreshSession: () => Promise<void>;
  purchaseBuilding: (buildingId: string, quantity?: number) => Promise<void>;
  upgradeBuilding: (buildingId: string) => Promise<void>;
  flushPassiveIncome: (options?: { keepAlive?: boolean }) => Promise<void>;
  logoutSession: (useKeepAlive?: boolean) => Promise<void>;
  loadLeaderboard: (force?: boolean) => Promise<void>;
  loadProfile: (force?: boolean) => Promise<void>;
  loadPrestigeStatus: (force?: boolean) => Promise<void>;
  performPrestige: () => Promise<void>;
  loadAchievements: (force?: boolean) => Promise<void>;
  claimAchievement: (slug: string) => Promise<void>;
}

const fallbackSessionError = 'Не удалось обновить данные. Попробуйте ещё раз позже.';

function mapBuilding(entry: InventoryBuildingPayload): BuildingState {
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
  xpIntoLevel: 0,
  xpToNextLevel: 100,
  tapLevel: 1,
  tapIncome: 0,
  energy: 0,
  stars: 0,
  passiveIncomePerSec: 0,
  passiveIncomeMultiplier: 1,
  boostMultiplier: 1,
  prestigeMultiplier: 1,
  achievementMultiplier: 1,
  prestigeLevel: 0,
  prestigeEnergySinceReset: 0,
  prestigeLastReset: null,
  prestigeNextThreshold: 1_000_000_000_000,
  prestigeEnergyToNext: 1_000_000_000_000,
  prestigeGainAvailable: 0,
  isPrestigeAvailable: false,
  isPrestigeLoading: false,
  prestigeStatusLoaded: false,
  streakCount: 0,
  bestStreak: 0,
  isCriticalStreak: false,
  lastTapAt: null,
  pendingPassiveEnergy: 0,
  pendingPassiveSeconds: 0,
  buildings: [],
  buildingsError: null,
  isProcessingBuildingId: null,
  sessionLastSyncedAt: null,
  sessionErrorMessage: null,
  leaderboardEntries: [],
  leaderboardLoaded: false,
  isLeaderboardLoading: false,
  leaderboardError: null,
  leaderboardTotal: 0,
  userLeaderboardEntry: null,
  profile: null,
  profileBoosts: [],
  isProfileLoading: false,
  profileError: null,
  achievements: [],
  achievementsLoaded: false,
  achievementsLoading: false,
  achievementsError: null,
  claimingAchievementSlug: null,
  isLoading: true,
  isInitialized: false,

  // Initialize game
  initGame: async () => {
    try {
      uiStore.dismissAuthError();
      set({ isLoading: true, sessionErrorMessage: null });

      const state = get();
      const wasInitialized = state.isInitialized;
      const previousLevel = state.level;

      logger.info('🎮 initGame starting', {
        hasAccessToken: !!authStore.accessToken,
        accessTokenLength: authStore.accessToken?.length || 0,
        previousLevel,
      });

      void logClientEvent(
        'initGame_start',
        {
          hasAccessToken: !!authStore.accessToken,
          accessTokenLength: authStore.accessToken?.length || 0,
          previousLevel,
        },
        'info'
      );

      if (!authStore.accessToken) {
        logger.warn('⚠️ initGame failed: no access token', {
          accessToken: authStore.accessToken,
        });

        void logClientEvent(
          'initGame_no_access_token',
          {
            accessToken: authStore.accessToken,
          },
          'warn'
        );
        set({ isLoading: false });
        return;
      }

      // Start session
      let sessionResponse;
      try {
        logger.info('📡 Calling /session endpoint', {
          hasToken: !!authStore.accessToken,
        });
        sessionResponse = await postQueue.enqueue(() => apiClient.post('/session'));
      } catch (sessionError) {
        const { status, message } = describeError(sessionError, fallbackSessionError);
        set({ sessionErrorMessage: message || fallbackSessionError });

        logger.error('❌ /session endpoint failed', {
          status,
          message,
          sessionError: sessionError instanceof Error ? sessionError.message : 'unknown',
        });

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
      const totalMultiplier = progress.passive_income_multiplier ?? 1;
      const boostMultiplier = progress.boost_multiplier ?? 1;
      const prestigeMultiplier = progress.prestige_multiplier ?? 1;
      const achievementMultiplier = progress.achievement_multiplier ?? 1;
      const prestigeLevel = progress.prestige_level ?? 0;
      const prestigeEnergySinceReset = progress.prestige_energy_since_reset ?? 0;
      const prestigeLastReset = progress.prestige_last_reset ?? null;
      const xpIntoLevel = progress.xp_into_level ?? 0;
      const xpToNextLevel = progress.xp_to_next_level ?? 0;
      const tapLevel = progress.tap_level ?? 1;
      const tapIncome = progress.tap_income ?? 0;
      const buildings = Array.isArray(inventory) ? inventory.map(mapBuilding) : [];

      const baselineLevel = wasInitialized ? previousLevel : progress.level;
      const levelsGained = Math.max(progress.level - baselineLevel, 0);
      const offlineSummary =
        offlineGains && offlineGains.energy > 0
          ? {
              energy: offlineGains.energy,
              xp: offlineGains.xp ?? 0,
              duration_sec: offlineGains.duration_sec,
              capped: offlineGains.capped,
              level_start: baselineLevel,
              level_end: progress.level,
              levels_gained: levelsGained,
            }
          : levelsGained > 0
            ? {
                energy: 0,
                xp: 0,
                duration_sec: 0,
                capped: false,
                level_start: baselineLevel,
                level_end: progress.level,
                levels_gained: levelsGained,
              }
            : null;

      uiStore.setOfflineSummary(offlineSummary);

      commitPassiveBuffers(set);
      set({
        userId: user.id,
        username: user.username,
        level: progress.level,
        xp: progress.xp,
        xpIntoLevel,
        xpToNextLevel,
        tapLevel,
        tapIncome,
        energy: progress.energy,
        passiveIncomePerSec: passivePerSec,
        passiveIncomeMultiplier: totalMultiplier,
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
        prestigeLevel,
        prestigeEnergySinceReset,
        prestigeLastReset,
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
        prestigeStatusLoaded: false,
      });

      get().configurePassiveIncome(passivePerSec, totalMultiplier, {
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
      });

      logger.info('✅ Game initialized successfully', {
        userId: user.id,
        level: progress.level,
        buildings: buildings.length,
        offlineGains: offlineGains?.energy || 0,
      });

      get()
        .loadPrestigeStatus()
        .catch(error => {
          logger.warn('Failed to load prestige status', {
            error: error instanceof Error ? error.message : 'unknown',
          });
        });
    } catch (error) {
      logger.error('❌ Failed to initialize game', {
        error: error instanceof Error ? error.message : 'unknown',
      });

      const fallbackMessage =
        'Не удалось авторизоваться. Проверьте подключение и попробуйте ещё раз.';
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
        xp_gained = 0,
        level,
        level_up,
        xp_into_level,
        xp_to_next_level,
        boost_multiplier,
        prestige_multiplier,
        achievement_multiplier,
        total_multiplier,
      } = response.data;

      const previousStreak = get().streakCount;
      const newStreak = previousStreak + count;
      const isCritical = newStreak > 0 && newStreak % STREAK_CRIT_THRESHOLD === 0;

      triggerHapticImpact(isCritical ? 'heavy' : 'light');

      commitPassiveBuffers(set);
      set(state => ({
        energy: Math.max(serverEnergy + state.pendingPassiveEnergy, state.energy + energyGained),
        level,
        xp: state.xp + xp_gained,
        xpIntoLevel: xp_into_level ?? Math.max(0, state.xpIntoLevel + xp_gained),
        xpToNextLevel: xp_to_next_level ?? Math.max(0, state.xpToNextLevel - xp_gained),
        streakCount: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        isCriticalStreak: isCritical,
        lastTapAt: Date.now(),
        passiveIncomeMultiplier: total_multiplier ?? state.passiveIncomeMultiplier,
        boostMultiplier: boost_multiplier ?? state.boostMultiplier,
        prestigeMultiplier: prestige_multiplier ?? state.prestigeMultiplier,
        achievementMultiplier: achievement_multiplier ?? state.achievementMultiplier,
      }));

      if (level_up) {
        // Show level up notification
        console.log('Level up!');
      }
    } catch (error) {
      console.error('Tap failed', error);
      throw error;
    }
  },

  // Handle upgrade
  upgrade: async (type: string, itemId: string) => {
    try {
      const response = await apiClient.post('/upgrade', {
        upgrade_type: type,
        item_id: itemId,
      });

      commitPassiveBuffers(set);
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

  configurePassiveIncome: (
    perSec: number,
    totalMultiplier: number,
    extras: {
      boostMultiplier?: number;
      prestigeMultiplier?: number;
      achievementMultiplier?: number;
    } = {}
  ) => {
    const flushPassiveIncome = get().flushPassiveIncome;

    set(state => ({
      passiveIncomePerSec: perSec,
      passiveIncomeMultiplier: totalMultiplier,
      boostMultiplier: extras.boostMultiplier ?? state.boostMultiplier,
      prestigeMultiplier: extras.prestigeMultiplier ?? state.prestigeMultiplier,
      achievementMultiplier: extras.achievementMultiplier ?? state.achievementMultiplier,
    }));

    if (passiveTicker) {
      clearInterval(passiveTicker);
      passiveTicker = null;
    }

    if (passiveFlushTimer) {
      clearInterval(passiveFlushTimer);
      passiveFlushTimer = null;
    }

    commitPassiveBuffers(set);
    resetPassiveBuffers();

    if (perSec > 0) {
      const tickSeconds = PASSIVE_TICK_INTERVAL_MS / 1000;

      passiveTicker = setInterval(() => {
        const delta = perSec * tickSeconds;
        queuePassiveUpdate(set, delta, tickSeconds);
      }, PASSIVE_TICK_INTERVAL_MS);

      passiveFlushTimer = setInterval(() => {
        commitPassiveBuffers(set);
        flushPassiveIncome().catch(error => {
          console.warn('Failed to flush passive income', error);
        });
      }, 15000);
    }
  },

  refreshSession: async () => {
    try {
      const state = get();
      const wasInitialized = state.isInitialized;
      const previousLevel = state.level;
      const response = await apiClient.post('/session');
      const { user, progress, offline_gains: offlineGains, inventory } = response.data;
      const buildings = Array.isArray(inventory) ? inventory.map(mapBuilding) : [];

      const baselineLevel = wasInitialized ? previousLevel : progress.level;
      const levelsGained = Math.max(progress.level - baselineLevel, 0);
      const offlineSummary =
        offlineGains && offlineGains.energy > 0
          ? {
              energy: offlineGains.energy,
              xp: offlineGains.xp ?? 0,
              duration_sec: offlineGains.duration_sec,
              capped: offlineGains.capped,
              level_start: baselineLevel,
              level_end: progress.level,
              levels_gained: levelsGained,
            }
          : levelsGained > 0
            ? {
                energy: 0,
                xp: 0,
                duration_sec: 0,
                capped: false,
                level_start: baselineLevel,
                level_end: progress.level,
                levels_gained: levelsGained,
              }
            : null;

      uiStore.setOfflineSummary(offlineSummary);

      const currentState = get();
      const xpIntoLevel = progress.xp_into_level ?? currentState.xpIntoLevel;
      const xpToNextLevel = progress.xp_to_next_level ?? currentState.xpToNextLevel;
      const tapLevel = progress.tap_level ?? currentState.tapLevel;
      const tapIncome = progress.tap_income ?? currentState.tapIncome;
      const passivePerSec = progress.passive_income_per_sec ?? 0;
      const totalMultiplier =
        progress.passive_income_multiplier ?? currentState.passiveIncomeMultiplier;
      const boostMultiplier = progress.boost_multiplier ?? currentState.boostMultiplier;
      const prestigeMultiplier = progress.prestige_multiplier ?? currentState.prestigeMultiplier;
      const achievementMultiplier =
        progress.achievement_multiplier ?? currentState.achievementMultiplier;
      const prestigeLevel = progress.prestige_level ?? currentState.prestigeLevel;
      const prestigeEnergySinceReset =
        progress.prestige_energy_since_reset ?? currentState.prestigeEnergySinceReset;
      const prestigeLastReset = progress.prestige_last_reset ?? currentState.prestigeLastReset;

      commitPassiveBuffers(set);
      set({
        userId: user.id,
        username: user.username,
        level: progress.level,
        xp: progress.xp,
        xpIntoLevel,
        xpToNextLevel,
        tapLevel,
        tapIncome,
        energy: progress.energy,
        passiveIncomePerSec: passivePerSec,
        passiveIncomeMultiplier: totalMultiplier,
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
        prestigeLevel,
        prestigeEnergySinceReset,
        prestigeLastReset,
        lastTapAt: Date.now(),
        buildings,
        buildingsError: null,
        pendingPassiveEnergy: 0,
        pendingPassiveSeconds: 0,
        sessionLastSyncedAt: Date.now(),
        sessionErrorMessage: null,
      });
      get().configurePassiveIncome(passivePerSec, totalMultiplier, {
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
      });
    } catch (error) {
      console.error('Failed to refresh session snapshot', error);

      const { status, message } = describeError(error, fallbackSessionError);
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

  flushPassiveIncome: async ({ keepAlive = false }: { keepAlive?: boolean } = {}) => {
    commitPassiveBuffers(set);
    const pendingSeconds = get().pendingPassiveSeconds;
    const accessToken = authStore.accessToken;
    const authReady = authStore.authReady;
    if (!pendingSeconds || pendingSeconds <= 0 || passiveFlushInFlight) {
      return;
    }
    if (!accessToken || !authReady) {
      void logClientEvent(
        'tick_skip_unauthenticated',
        {
          pending_seconds: pendingSeconds,
          keep_alive: keepAlive,
        },
        'warn'
      );
      return;
    }

    try {
      passiveFlushInFlight = true;
      let payload: TickSyncResponse;

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
        payload = (await response.json()) as TickSyncResponse;
      } else {
        const response = await apiClient.post('/tick', { time_delta: pendingSeconds });
        payload = response.data as TickSyncResponse;
      }

      const passivePerSec = payload.passive_income_per_sec ?? get().passiveIncomePerSec;
      const totalMultiplier = payload.passive_income_multiplier ?? get().passiveIncomeMultiplier;
      const boostMultiplier = payload.boost_multiplier ?? get().boostMultiplier;
      const prestigeMultiplier = payload.prestige_multiplier ?? get().prestigeMultiplier;
      const achievementMultiplier = payload.achievement_multiplier ?? get().achievementMultiplier;

      if (payload.access_token) {
        if (payload.refresh_token) {
          authStore.setTokens({
            accessToken: payload.access_token,
            refreshToken: payload.refresh_token,
          });
        } else {
          authStore.setAccessToken(payload.access_token);
        }
      }

      get().configurePassiveIncome(passivePerSec, totalMultiplier, {
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
      });

      set(state => ({
        energy: payload.energy,
        level: payload.level,
        xp: state.xp + (payload.xp_gained ?? 0),
        xpIntoLevel:
          payload.xp_into_level ?? Math.max(0, state.xpIntoLevel + (payload.xp_gained ?? 0)),
        xpToNextLevel: payload.xp_to_next_level ?? state.xpToNextLevel,
        pendingPassiveEnergy: 0,
        pendingPassiveSeconds: payload.pending_passive_sec ?? 0,
        sessionLastSyncedAt: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to sync passive income', error);
    } finally {
      passiveFlushInFlight = false;
    }
  },

  purchaseBuilding: async (buildingId: string, quantity = 1) => {
    if (!Number.isFinite(quantity)) {
      return;
    }
    const normalizedQuantity = Math.floor(quantity);
    if (!buildingId || normalizedQuantity <= 0) {
      return;
    }

    set({ isProcessingBuildingId: buildingId, buildingsError: null });

    try {
      await get().flushPassiveIncome();
      await logClientEvent(
        'building_purchase_request',
        { building_id: buildingId, quantity: normalizedQuantity },
        'info'
      );

      commitPassiveBuffers(set);

      const response = await apiClient.post<UpgradeResponsePayload>('/upgrade', {
        building_id: buildingId,
        action: 'purchase',
        quantity: normalizedQuantity,
      });
      const payload = response.data ?? {};
      const completed = payload.purchased ?? normalizedQuantity;

      set(state => ({
        xp: state.xp + (payload.xp_gained ?? 0),
        xpIntoLevel:
          payload.xp_into_level ?? Math.max(0, state.xpIntoLevel + (payload.xp_gained ?? 0)),
        xpToNextLevel: payload.xp_to_next_level ?? state.xpToNextLevel,
        energy: payload.energy ?? state.energy,
        level: payload.level ?? state.level,
      }));

      await logClientEvent(
        'building_purchase_success',
        {
          building_id: buildingId,
          requested: normalizedQuantity,
          quantity: completed,
          next_cost: payload.building?.next_cost ?? null,
        },
        'info'
      );

      await get().refreshSession();
    } catch (error) {
      const { status, message } = describeError(error, fallbackSessionError);
      await logClientEvent(
        'building_purchase_error',
        {
          building_id: buildingId,
          requested: normalizedQuantity,
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

      const response = await apiClient.post<UpgradeResponsePayload>('/upgrade', {
        building_id: buildingId,
        action: 'upgrade',
      });
      const payload = response.data ?? {};

      commitPassiveBuffers(set);
      set(state => ({
        energy: payload.energy ?? state.energy,
        level: payload.level ?? state.level,
        xp: state.xp + (payload.xp_gained ?? 0),
        xpIntoLevel:
          payload.xp_into_level ?? Math.max(0, state.xpIntoLevel + (payload.xp_gained ?? 0)),
        xpToNextLevel: payload.xp_to_next_level ?? state.xpToNextLevel,
      }));

      await logClientEvent(
        'building_upgrade_success',
        {
          building_id: buildingId,
          new_level: payload.building?.level ?? null,
        },
        'info'
      );

      await get().refreshSession();
    } catch (error) {
      const { status, message } = describeError(error, fallbackSessionError);
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

  loadLeaderboard: async (force = false) => {
    const { leaderboardLoaded, isLeaderboardLoading } = get();
    if (!force && (leaderboardLoaded || isLeaderboardLoading)) {
      return;
    }

    set({ isLeaderboardLoading: true, leaderboardError: null });

    try {
      const response = await fetchLeaderboard(100);
      set({
        leaderboardEntries: response.leaderboard,
        leaderboardTotal: response.total_players,
        userLeaderboardEntry: response.user_entry,
        leaderboardLoaded: true,
        isLeaderboardLoading: false,
      });
    } catch (error) {
      const { message } = describeError(error, fallbackSessionError);
      set({
        leaderboardError: message,
        isLeaderboardLoading: false,
      });
    }
  },

  loadProfile: async (force = false) => {
    const { userId, profile, isProfileLoading } = get();
    if (!userId) {
      return;
    }
    if (!force && (profile?.user.id === userId || isProfileLoading)) {
      return;
    }

    set({ isProfileLoading: true, profileError: null });
    try {
      const response = await fetchProfile(userId);
      set({
        profile: response,
        profileBoosts: response.boosts,
        isProfileLoading: false,
      });
    } catch (error) {
      const { message } = describeError(error, fallbackSessionError);
      set({
        profileError: message,
        isProfileLoading: false,
      });
    }
  },

  loadPrestigeStatus: async (force = false) => {
    const { prestigeStatusLoaded, isPrestigeLoading } = get();
    if (!force && (prestigeStatusLoaded || isPrestigeLoading)) {
      return;
    }

    set({ isPrestigeLoading: true });

    try {
      const status = await fetchPrestigeStatus();
      const boostMultiplier = get().boostMultiplier;
      const achievementMultiplier = get().achievementMultiplier;
      const passivePerSec = get().passiveIncomePerSec;
      const totalMultiplier = boostMultiplier * status.prestige_multiplier * achievementMultiplier;

      set({
        prestigeStatusLoaded: true,
        prestigeLevel: status.prestige_level,
        prestigeMultiplier: status.prestige_multiplier,
        prestigeEnergySinceReset: status.energy_since_prestige,
        prestigeNextThreshold: status.next_threshold_energy,
        prestigeEnergyToNext: status.energy_to_next_threshold,
        prestigeGainAvailable: status.potential_multiplier_gain,
        isPrestigeAvailable: status.can_prestige,
        isPrestigeLoading: false,
      });

      get().configurePassiveIncome(passivePerSec, totalMultiplier, {
        boostMultiplier,
        prestigeMultiplier: status.prestige_multiplier,
        achievementMultiplier,
      });
    } catch (error) {
      console.error('Failed to load prestige status', error);
      set({
        prestigeStatusLoaded: false,
        isPrestigeLoading: false,
      });
    }
  },

  performPrestige: async () => {
    if (get().isPrestigeLoading) {
      return;
    }

    set({ isPrestigeLoading: true });
    try {
      await performPrestigeReset();
      await get().refreshSession();
      await get().loadPrestigeStatus(true);
      set({ isPrestigeLoading: false });
    } catch (error) {
      console.error('Prestige action failed', error);
      set({ isPrestigeLoading: false });
      throw error;
    }
  },

  loadAchievements: async (force = false) => {
    const { achievementsLoaded, achievementsLoading, achievementsError } = get();
    if (!force && achievementsLoaded && !achievementsError) {
      return;
    }
    if (achievementsLoading) {
      return;
    }

    set({ achievementsLoading: true, achievementsError: null });

    try {
      const data = await fetchAchievements();
      set({
        achievements: data,
        achievementsLoaded: true,
        achievementsLoading: false,
        achievementsError: null,
      });
    } catch (error) {
      const { message } = describeError(error, 'Не удалось загрузить достижения');
      console.error('Failed to load achievements', error);
      set({
        achievementsLoading: false,
        achievementsError: message,
      });
    }
  },

  claimAchievement: async (slug: string) => {
    if (!slug) {
      return;
    }
    if (get().claimingAchievementSlug === slug) {
      return;
    }

    set({ claimingAchievementSlug: slug });

    try {
      const response = await claimAchievementApi(slug);
      const updatedAchievements = await fetchAchievements();

      const boostMultiplier = get().boostMultiplier;
      const prestigeMultiplier = get().prestigeMultiplier;
      const passivePerSec = get().passiveIncomePerSec;
      const achievementMultiplier = response.newAchievementMultiplier;
      const totalMultiplier = boostMultiplier * prestigeMultiplier * achievementMultiplier;

      set({
        achievements: updatedAchievements,
        achievementsLoaded: true,
        achievementsLoading: false,
        achievementsError: null,
        achievementMultiplier,
        passiveIncomeMultiplier: totalMultiplier,
        claimingAchievementSlug: null,
      });

      get().configurePassiveIncome(passivePerSec, totalMultiplier, {
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
      });

      const matched = updatedAchievements.find(item => item.slug === slug);
      uiStore.addNotification({
        type: 'achievement',
        title: matched ? `Достижение: ${matched.name}` : 'Достижение',
        message: `Уровень ${response.tier} активирован · ×${response.rewardMultiplier.toFixed(2)}`,
        duration: 4800,
        icon: 'trophy',
      });

      void logClientEvent('achievement_claim_success', {
        slug,
        tier: response.tier,
        reward_multiplier: response.rewardMultiplier,
        achievement_multiplier: achievementMultiplier,
      });
    } catch (error) {
      const { message } = describeError(error, 'Не удалось получить награду');
      console.error('Failed to claim achievement', error);
      set({
        achievementsError: message,
        claimingAchievementSlug: null,
      });
      void logClientEvent(
        'achievement_claim_failed',
        {
          slug,
          message,
        },
        'error'
      );
      uiStore.addNotification({
        type: 'toast',
        message,
        icon: 'error',
        duration: 4000,
      });
    }
  },
}));

export const streakConfig = {
  resetMs: STREAK_RESET_MS,
  criticalThreshold: STREAK_CRIT_THRESHOLD,
};
