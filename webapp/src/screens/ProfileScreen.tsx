import { useCallback, useEffect } from 'react';
import { TabPageSurface, Surface, ProfileSkeleton, ProfileSettingsScreen } from '@/components';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

export function ProfileScreen() {
  const loadProfile = useGameStore(state => state.loadProfile);
  const isProfileLoading = useGameStore(state => state.isProfileLoading);
  const profileError = useGameStore(state => state.profileError);
  const authReady = useAuthStore(state => state.authReady);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    loadProfile().catch(error => {
      console.warn('Failed to load profile (ProfileScreen)', error);
    });
  }, [authReady, loadProfile]);

  const handleRetry = useCallback(() => {
    loadProfile(true).catch(error => {
      console.warn('Failed to reload profile (ProfileScreen)', error);
    });
  }, [loadProfile]);

  return (
    <TabPageSurface className="gap-4" aria-label="Экран профиля">
      <header className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold text-text-primary">Профиль</h1>
        <p className="text-body text-text-secondary">
          Здесь собраны ваши достижения, скины и настройки Energy Planet.
        </p>
      </header>

      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col gap-lg"
        aria-live="polite"
      >
        {profileError && !isProfileLoading ? (
          <div className="flex flex-col items-center gap-3 text-center text-text-secondary">
            <p>Не удалось загрузить профиль.</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-2xl border border-border-layer-strong px-4 py-2 text-body text-text-primary transition-colors duration-150 hover:bg-layer-overlay-ghost-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
            >
              Повторить
            </button>
          </div>
        ) : isProfileLoading ? (
          <ProfileSkeleton />
        ) : (
          <ProfileSettingsScreen />
        )}
      </Surface>
    </TabPageSurface>
  );
}
