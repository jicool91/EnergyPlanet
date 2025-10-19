/**
 * Game State Management (Zustand)
 */

import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

interface GameState {
  // User data
  userId: string | null;
  username: string | null;
  level: number;
  xp: number;
  energy: number;

  // Game state
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initGame: () => Promise<void>;
  tap: (count: number) => Promise<void>;
  upgrade: (type: string, itemId: string) => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  // Initial state
  userId: null,
  username: null,
  level: 1,
  xp: 0,
  energy: 0,
  isLoading: true,
  isInitialized: false,

  // Initialize game
  initGame: async () => {
    try {
      set({ isLoading: true });

      // Authenticate with Telegram
      const initData = window.Telegram?.WebApp?.initData || '';
      const authResponse = await apiClient.post('/auth/telegram', { initData });

      // Store tokens
      localStorage.setItem('access_token', authResponse.data.access_token);
      localStorage.setItem('refresh_token', authResponse.data.refresh_token);

      // Start session
      const sessionResponse = await apiClient.post('/session');
      const { user, progress } = sessionResponse.data;

      set({
        userId: user.id,
        username: user.username,
        level: progress.level,
        xp: progress.xp,
        energy: progress.energy,
        isInitialized: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to initialize game', error);
      set({ isLoading: false });
    }
  },

  // Handle tap
  tap: async (count: number) => {
    try {
      const response = await apiClient.post('/tap', { tap_count: count });
      const { energy, xp_gained, level, level_up } = response.data;

      set({
        energy,
        level,
        xp: get().xp + xp_gained,
      });

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
    } catch (error) {
      console.error('Upgrade failed', error);
      throw error;
    }
  },
}));
