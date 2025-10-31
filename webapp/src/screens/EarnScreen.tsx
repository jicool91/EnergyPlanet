import { useCallback, useEffect } from 'react';
import { TabPageSurface, ProfileSettingsScreen, ProfileSkeleton } from '@/components';
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
      <header>
        <h1 className="text-heading font-semibold text-[var(--color-text-primary)]">Профиль</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Управляйте аккаунтом, подключайте уведомления и проверяйте прогресс.
        </p>
      </header>

      <TabPageSurface>
        {profileError && !isProfileLoading ? (
          <div className="flex flex-col items-center gap-3 text-center text-[var(--color-text-secondary)]">
            <p>Не удалось загрузить профиль.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-2xl border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
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
