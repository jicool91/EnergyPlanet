import { create } from 'zustand';
import type { TelegramThemeParams } from '../services/telegram';
import { DEFAULT_THEME } from '../services/telegram';

export interface OfflineSummarySnapshot {
  energy: number;
  xp: number;
  duration_sec: number;
  capped: boolean;
}

interface UIState {
  authErrorMessage: string | null;
  isAuthModalOpen: boolean;
  offlineSummary: OfflineSummarySnapshot | null;
  theme: TelegramThemeParams;
  openAuthError: (message: string) => void;
  dismissAuthError: () => void;
  setOfflineSummary: (summary: OfflineSummarySnapshot | null) => void;
  updateTheme: (theme: TelegramThemeParams) => void;
  clearOfflineSummary: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  authErrorMessage: null,
  isAuthModalOpen: false,
  offlineSummary: null,
  theme: DEFAULT_THEME,
  openAuthError: (message: string) => set({ authErrorMessage: message, isAuthModalOpen: true }),
  dismissAuthError: () => set({ authErrorMessage: null, isAuthModalOpen: false }),
  setOfflineSummary: (summary) => set({ offlineSummary: summary }),
  updateTheme: (theme) => set({ theme }),
  clearOfflineSummary: () => set({ offlineSummary: null }),
}));

export const uiStore = {
  openAuthError(message: string) {
    useUIStore.getState().openAuthError(message);
  },
  dismissAuthError() {
    useUIStore.getState().dismissAuthError();
  },
  setOfflineSummary(summary: OfflineSummarySnapshot | null) {
    useUIStore.getState().setOfflineSummary(summary);
  },
  clearOfflineSummary() {
    useUIStore.getState().clearOfflineSummary();
  },
  updateTheme(theme: TelegramThemeParams) {
    useUIStore.getState().updateTheme(theme);
  },
  get theme() {
    return useUIStore.getState().theme;
  },
};
