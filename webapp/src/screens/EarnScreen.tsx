import { useCallback, useEffect } from 'react';
import {
  TabPageSurface,
  ProfileSettingsScreen,
  ProfileSkeleton,
  EarnTasksBoard,
} from '@/components';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useAdminModal } from '@/contexts/AdminModalContext';

export function EarnScreen() {
  const loadProfile = useGameStore(state => state.loadProfile);
  const isProfileLoading = useGameStore(state => state.isProfileLoading);
  const profileError = useGameStore(state => state.profileError);
  const authReady = useAuthStore(state => state.authReady);
  const { openAdminMetrics } = useAdminModal();

  useEffect(() => {
    if (!authReady) {
      return;
    }
    loadProfile().catch(error => {
      console.warn('Failed to load profile', error);
    });
  }, [authReady, loadProfile]);

  const handleRetry = useCallback(() => {
    loadProfile(true).catch(error => {
      console.warn('Failed to reload profile', error);
    });
  }, [loadProfile]);

  return (
    <div className="flex flex-col gap-4">
      <EarnTasksBoard />

      <header>
        <h2 className="text-heading font-semibold text-text-primary">Профиль</h2>
        <p className="text-sm text-text-secondary">
          Управляйте аккаунтом, подключайте уведомления и проверяйте прогресс.
        </p>
      </header>

      <TabPageSurface>
        {profileError && !isProfileLoading ? (
          <div className="flex flex-col items-center gap-3 text-center text-text-secondary">
            <p>Не удалось загрузить профиль.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-2xl border border-border-layer-strong px-4 py-2 text-sm text-text-primary transition-colors duration-150 hover:bg-layer-overlay-ghost-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
            >
              Повторить
            </button>
          </div>
        ) : isProfileLoading ? (
          <ProfileSkeleton />
        ) : (
          <ProfileSettingsScreen onShowAdminPanel={openAdminMetrics} />
        )}
      </TabPageSurface>
    </div>
  );
}
