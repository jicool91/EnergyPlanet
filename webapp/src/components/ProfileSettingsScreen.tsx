import { memo, useMemo, useState, useEffect } from 'react';
import { Button } from './Button';
import { ProfilePanel } from './ProfilePanel';
import { SettingsScreen } from './settings';
import { logClientEvent } from '@/services/telemetry';

type AccountSection = 'settings' | 'profile';

const SECTIONS: Array<{ id: AccountSection; label: string; icon: string }> = [
  { id: 'profile', label: 'Профиль', icon: '👤' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
];

interface ProfileSettingsScreenProps {
  defaultSection?: AccountSection;
  onClose?: () => void;
  onShowAdminPanel?: () => void;
}

/**
 * Combined screen that merges profile insights and application settings
 * into a single entry point opened from the header.
 */
const ProfileSettingsScreenComponent: React.FC<ProfileSettingsScreenProps> = ({
  defaultSection = 'profile',
  onClose,
  onShowAdminPanel,
}) => {
  const [section, setSection] = useState<AccountSection>(defaultSection);

  useEffect(() => {
    void logClientEvent('profile_settings_screen_render', {
      section,
      defaultSection,
    });
  }, [section, defaultSection]);

  const activeLabel = useMemo(
    () => SECTIONS.find(tab => tab.id === section)?.label ?? '',
    [section]
  );

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex items-start justify-between gap-sm">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-heading">Аккаунт</h2>
          <p className="m-0 text-caption text-[var(--color-text-secondary)]">
            Управляйте настройками и смотрите прогресс профиля.
          </p>
        </div>
        {onClose && (
          <Button variant="secondary" size="sm" onClick={onClose} aria-label="Закрыть аккаунт">
            Закрыть
          </Button>
        )}
      </header>

      <nav
        className="flex gap-1 rounded-xl bg-[var(--color-surface-secondary)]/70 p-1"
        aria-label="Навигация по аккаунту"
      >
        {SECTIONS.map(tab => {
          const isActive = tab.id === section;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus-ring ${
                isActive
                  ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] shadow-glow'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              aria-pressed={isActive}
              aria-label={tab.label}
            >
              <span className="mr-1" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section
        className="flex flex-col gap-lg"
        aria-live="polite"
        aria-label={`Раздел ${activeLabel}`}
      >
        {section === 'profile' ? (
          <ProfilePanel />
        ) : (
          <SettingsScreen onClose={onClose} onShowAdminPanel={onShowAdminPanel} />
        )}
      </section>
    </div>
  );
};

export const ProfileSettingsScreen = memo(ProfileSettingsScreenComponent);
