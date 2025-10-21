/**
 * Game State Management (Zustand)
 */

import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { apiClient } from '../services/apiClient';
import { postQueue } from '../services/requestQueue';

const STREAK_RESET_MS = 4000;
const STREAK_CRIT_THRESHOLD = 25;

let passiveTicker: ReturnType<typeof setInterval> | null = null;

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
  offlineSummary: {
    energy: number;
    xp: number;
    duration_sec: number;
    capped: boolean;
  } | null;

  // Game state
  isLoading: boolean;
  isInitialized: boolean;
  authErrorMessage: string | null;
  isAuthModalOpen: boolean;

  // Actions
  initGame: () => Promise<void>;
  tap: (count: number) => Promise<void>;
  upgrade: (type: string, itemId: string) => Promise<void>;
  dismissAuthError: () => void;
  resetStreak: () => void;
  configurePassiveIncome: (perSec: number, multiplier: number) => void;
  refreshSession: () => Promise<void>;
  acknowledgeOfflineSummary: () => void;
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
  offlineSummary: null,
  isLoading: true,
  isInitialized: false,
  authErrorMessage: null,
  isAuthModalOpen: false,

  // Initialize game
  initGame: async () => {
    try {
      set({ isLoading: true, authErrorMessage: null, isAuthModalOpen: false });

      // Authenticate with Telegram
      const initData = window.Telegram?.WebApp?.initData || '';
      const authResponse = await postQueue.enqueue(() => apiClient.post('/auth/telegram', { initData }));

      // Store tokens
      localStorage.setItem('access_token', authResponse.data.access_token);
      localStorage.setItem('refresh_token', authResponse.data.refresh_token);

      // Start session
      const sessionResponse = await postQueue.enqueue(() => apiClient.post('/session'));
      const { user, progress, offline_gains: offlineGains } = sessionResponse.data;
      const passivePerSec = progress.passive_income_per_sec ?? 0;
      const passiveMultiplier = progress.passive_income_multiplier ?? 1;

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
        offlineSummary:
          offlineGains && offlineGains.energy > 0
            ? {
                energy: offlineGains.energy,
                xp: offlineGains.xp ?? 0,
                duration_sec: offlineGains.duration_sec,
                capped: offlineGains.capped,
              }
            : null,
        isInitialized: true,
        isLoading: false,
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

      set({
        isLoading: false,
        authErrorMessage: message,
        isAuthModalOpen: true,
      });
    }
  },

  // Handle tap
  tap: async (count: number) => {
    try {
      const response = await apiClient.post('/tap', { tap_count: count });
      const { energy, xp_gained, level, level_up } = response.data;

      const previousStreak = get().streakCount;
      const newStreak = previousStreak + count;
      const isCritical = newStreak > 0 && newStreak % STREAK_CRIT_THRESHOLD === 0;

      set(state => ({
        energy,
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

  dismissAuthError: () => {
    set({ authErrorMessage: null, isAuthModalOpen: false });
  },

  resetStreak: () => {
    if (get().streakCount === 0) {
      return;
    }
    set({ streakCount: 0, isCriticalStreak: false });
  },

  configurePassiveIncome: (perSec: number, multiplier: number) => {
    set({ passiveIncomePerSec: perSec, passiveIncomeMultiplier: multiplier });

    if (passiveTicker) {
      clearInterval(passiveTicker);
      passiveTicker = null;
    }

    if (perSec > 0) {
      passiveTicker = setInterval(() => {
        set(state => ({ energy: state.energy + perSec }));
      }, 1000);
    }
  },

  refreshSession: async () => {
    try {
      const response = await apiClient.post('/session');
      const { user, progress, offline_gains: offlineGains } = response.data;

      set({
        userId: user.id,
        username: user.username,
        level: progress.level,
        xp: progress.xp,
        energy: progress.energy,
        lastTapAt: Date.now(),
        offlineSummary:
          offlineGains && offlineGains.energy > 0
            ? {
                energy: offlineGains.energy,
                xp: offlineGains.xp ?? 0,
                duration_sec: offlineGains.duration_sec,
                capped: offlineGains.capped,
              }
            : null,
      });

      const passivePerSec = progress.passive_income_per_sec ?? 0;
      const passiveMultiplier = progress.passive_income_multiplier ?? 1;
      get().configurePassiveIncome(passivePerSec, passiveMultiplier);
    } catch (error) {
      console.error('Failed to refresh session snapshot', error);
    }
  },

  acknowledgeOfflineSummary: () => {
    set({ offlineSummary: null });
  },
}));

export const streakConfig = {
  resetMs: STREAK_RESET_MS,
  criticalThreshold: STREAK_CRIT_THRESHOLD,
};
