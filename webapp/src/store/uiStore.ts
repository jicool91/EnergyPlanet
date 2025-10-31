import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TelegramThemeParams } from '@/utils/telegramTheme';
import { DEFAULT_THEME } from '@/utils/telegramTheme';

const notificationTimers = new Map<string, number>();

export interface OfflineSummarySnapshot {
  energy: number;
  xp: number;
  duration_sec: number;
  capped: boolean;
  level_start?: number;
  level_end?: number;
  levels_gained?: number;
}

export interface Notification {
  id: string;
  type: 'toast' | 'achievement' | 'alert';
  title?: string;
  message: string;
  duration?: number; // ms, 0 = persistent
  icon?: 'success' | 'error' | 'warning' | 'info' | 'star' | 'trophy';
  onDismiss?: () => void;
}

interface UIState {
  authErrorMessage: string | null;
  isAuthModalOpen: boolean;
  offlineSummary: OfflineSummarySnapshot | null;
  theme: TelegramThemeParams;
  notifications: Notification[];
  openAuthError: (message: string) => void;
  dismissAuthError: () => void;
  setOfflineSummary: (summary: OfflineSummarySnapshot | null) => void;
  updateTheme: (theme: TelegramThemeParams) => void;
  clearOfflineSummary: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    set => ({
      authErrorMessage: null,
      isAuthModalOpen: false,
      offlineSummary: null,
      theme: DEFAULT_THEME,
      notifications: [],
      openAuthError: (message: string) => set({ authErrorMessage: message, isAuthModalOpen: true }),
      dismissAuthError: () => set({ authErrorMessage: null, isAuthModalOpen: false }),
      setOfflineSummary: summary => set({ offlineSummary: summary }),
      updateTheme: theme => set({ theme }),
      clearOfflineSummary: () => set({ offlineSummary: null }),
      addNotification: notification => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const fullNotification: Notification = { ...notification, id };

        set(state => ({
          notifications: [...state.notifications, fullNotification],
        }));

        // Auto-dismiss if duration specified
        if (typeof window !== 'undefined' && notification.duration && notification.duration > 0) {
          const timer = window.setTimeout(() => {
            notificationTimers.delete(id);
            useUIStore.getState().removeNotification(id);
          }, notification.duration);
          notificationTimers.set(id, timer);
        }

        return id;
      },
      removeNotification: id =>
        set(state => {
          if (typeof window !== 'undefined') {
            const timer = notificationTimers.get(id);
            if (timer) {
              window.clearTimeout(timer);
              notificationTimers.delete(id);
            }
          }
          return {
            notifications: state.notifications.filter(n => n.id !== id),
          };
        }),
    }),
    {
      name: 'energy-ui',
      partialize: state => ({
        theme: state.theme,
      }),
      version: 1,
    }
  )
);

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
  addNotification(notification: Omit<Notification, 'id'>) {
    return useUIStore.getState().addNotification(notification);
  },
  removeNotification(id: string) {
    useUIStore.getState().removeNotification(id);
  },
  get theme() {
    return useUIStore.getState().theme;
  },
};
