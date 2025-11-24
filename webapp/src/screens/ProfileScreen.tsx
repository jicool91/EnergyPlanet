import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TabPageSurface, Surface, ProfileSkeleton, ProfileSettingsScreen } from '@/components';
import type { AccountSection } from '@/components/ProfileSettingsScreen';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';

const SECTION_STORAGE_KEY = 'profile-last-section';

export function ProfileScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const loadProfile = useGameStore(state => state.loadProfile);
  const isProfileLoading = useGameStore(state => state.isProfileLoading);
  const profileError = useGameStore(state => state.profileError);
  const authReady = useAuthStore(state => state.authReady);
  const activeSection = useMemo<AccountSection>(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('section');
    if (q === 'settings' || q === 'profile') {
      return q;
    }
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(SECTION_STORAGE_KEY);
      if (stored === 'settings' || stored === 'profile') {
        return stored;
      }
    }
    return 'profile';
  }, [location.search]);

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

  const handleSectionChange = useCallback(
    (section: AccountSection) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SECTION_STORAGE_KEY, section);
      }
      const params = new URLSearchParams(location.search);
      params.set('section', section);
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    },
    [location.pathname, location.search, navigate]
  );

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
          <ProfileSettingsScreen
            defaultSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        )}
      </Surface>
    </TabPageSurface>
  );
}
