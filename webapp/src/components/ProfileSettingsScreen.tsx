import { memo, useMemo, useState, useEffect, useCallback, useId, useRef } from 'react';
import { Button } from './Button';
import { ProfilePanel } from './ProfilePanel';
import { SettingsScreen } from './settings';
import { logClientEvent } from '@/services/telemetry';

export type AccountSection = 'settings' | 'profile';

const SECTIONS: Array<{ id: AccountSection; label: string; icon: string }> = [
  { id: 'profile', label: 'Профиль', icon: '👤' },
  { id: 'settings', label: 'Настройки', icon: '⚙️' },
];

interface ProfileSettingsScreenProps {
  defaultSection?: AccountSection;
  onClose?: () => void;
  onShowAdminPanel?: () => void;
  onSectionChange?: (section: AccountSection) => void;
}

/**
 * Combined screen that merges profile insights and application settings
 * into a single entry point opened from the header.
 */
const ProfileSettingsScreenComponent: React.FC<ProfileSettingsScreenProps> = ({
  defaultSection = 'profile',
  onClose,
  onShowAdminPanel,
  onSectionChange,
}) => {
  const [section, setSection] = useState<AccountSection>(defaultSection);
  const tabRefs = useRef<Partial<Record<AccountSection, HTMLButtonElement | null>>>({});
  const baseId = useId();
  const getTabId = useCallback((value: AccountSection) => `${baseId}-${value}-tab`, [baseId]);
  const getPanelId = useCallback((value: AccountSection) => `${baseId}-${value}-panel`, [baseId]);

  useEffect(() => {
    void logClientEvent('profile_settings_screen_render', {
      section,
      defaultSection,
    });
  }, [section, defaultSection]);

  useEffect(() => {
    setSection(defaultSection);
  }, [defaultSection]);

  const selectSection = useCallback(
    (nextSection: AccountSection) => {
      setSection(nextSection);
      onSectionChange?.(nextSection);
    },
    [onSectionChange]
  );

  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const orientation = ['ArrowRight', 'ArrowLeft'];
      if (!orientation.includes(event.key)) {
        return;
      }
      event.preventDefault();
      const order = SECTIONS.map(tab => tab.id);
      const nextIndex =
        event.key === 'ArrowRight'
          ? (index + 1) % order.length
          : (index - 1 + order.length) % order.length;
      const nextSection = order[nextIndex];
      selectSection(nextSection);
      const ref = tabRefs.current[nextSection];
      ref?.focus();
    },
    [selectSection]
  );

  const activeLabel = useMemo(
    () => SECTIONS.find(tab => tab.id === section)?.label ?? '',
    [section]
  );

  return (
    <div className="flex flex-col gap-lg">
      <header className="flex items-start justify-between gap-sm">
        <div className="flex flex-col gap-xs">
          <h2 className="m-0 text-heading font-semibold text-text-primary">Аккаунт</h2>
          <p className="m-0 text-caption text-text-secondary">
            Управляйте настройками и смотрите прогресс профиля.
          </p>
        </div>
        {onClose && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            aria-label="Закрыть аккаунт"
            className="shadow-elevation-2"
          >
            Закрыть
          </Button>
        )}
      </header>

      <nav
        className="flex gap-xs rounded-2xl border border-border-cyan/50 bg-surface-glass-strong p-xs"
        aria-label="Навигация по аккаунту"
        role="tablist"
      >
        {SECTIONS.map((tab, index) => {
          const isActive = tab.id === section;
          return (
            <button
              key={tab.id}
              ref={node => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={getTabId(tab.id)}
              aria-selected={isActive}
              aria-controls={getPanelId(tab.id)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectSection(tab.id)}
              onKeyDown={event => handleTabKeyDown(event, index)}
              className={`flex-1 rounded-2xl px-sm-plus py-xs-plus text-caption font-semibold uppercase tracking-[0.08em] transition-all duration-150 focus-ring ${
                isActive
                  ? 'bg-gradient-to-r from-accent-cyan/60 via-feedback-success/50 to-accent-magenta/55 text-text-primary shadow-glow'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-glass'
              }`}
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
        role="tabpanel"
        id={getPanelId(section)}
        aria-labelledby={getTabId(section)}
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
