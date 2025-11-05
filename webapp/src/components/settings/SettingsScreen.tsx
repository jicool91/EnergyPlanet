import { useCallback, useState, useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { usePreferencesStore, type ThemeMode, type Language } from '../../store/preferencesStore';
import { useNotification } from '../../hooks/useNotification';
import { useHaptic } from '../../hooks/useHaptic';
import { Button } from '../Button';
import { Card } from '../Card';
import { Toggle } from './Toggle';
import { SliderControl } from './SliderControl';
import { SettingsSection } from './SettingsSection';
import { ReferralInviteCard } from './ReferralInviteCard';
import { logClientEvent } from '@/services/telemetry';
import { useShallow } from 'zustand/react/shallow';

const INTENSITY_OPTIONS = ['light', 'medium', 'strong'] as const;
const THEME_OPTIONS: ThemeMode[] = ['light', 'dark', 'auto'];
const LANGUAGE_OPTIONS: Language[] = ['ru', 'en'];

interface SettingsScreenProps {
  onClose?: () => void;
  onShowAdminPanel?: () => void;
}

/**
 * SettingsScreen Component
 * Displays game settings, preferences, and account information
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, onShowAdminPanel }) => {
  const { profile, userId, username, logoutSession, isAdmin } = useGameStore(
    useShallow(state => ({
      profile: state.profile,
      userId: state.userId,
      username: state.username,
      logoutSession: state.logoutSession,
      isAdmin: state.isAdmin,
    }))
  );
  const { success, warning } = useNotification();
  const { light } = useHaptic();
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (profile || !userId) {
      if (profile) {
        void logClientEvent('settings_panel_render', {
          userId,
          equippedPlanet: profile.profile.equipped_planet_skin,
        });
      }
      return;
    }
    void logClientEvent('settings_panel_missing_profile', { userId }, 'warn');
  }, [profile, userId]);

  useEffect(() => {
    void logClientEvent('settings_panel_mount', {
      hasProfile: !!profile,
      userId,
    });
    return () => {
      void logClientEvent('settings_panel_unmount', {
        userId,
      });
    };
  }, [profile, userId]);

  // Preferences
  const {
    soundEnabled,
    setSoundEnabled,
    tapSoundVolume,
    setTapSoundVolume,
    hapticEnabled,
    setHapticEnabled,
    hapticIntensity,
    setHapticIntensity,
    notificationsEnabled,
    setNotificationsEnabled,
    pushNotificationsEnabled,
    setPushNotificationsEnabled,
    theme,
    setTheme,
    language,
    setLanguage,
    reduceMotion,
    setReduceMotion,
    resetToDefaults,
  } = usePreferencesStore();

  const selectIntensity = useCallback(
    (intensity: (typeof INTENSITY_OPTIONS)[number]) => {
      light();
      setHapticIntensity(intensity);
    },
    [light, setHapticIntensity]
  );

  const selectTheme = useCallback(
    (mode: ThemeMode) => {
      light();
      setTheme(mode);
    },
    [light, setTheme]
  );

  const selectLanguage = useCallback(
    (lang: Language) => {
      light();
      setLanguage(lang);
    },
    [light, setLanguage]
  );

  const handleIntensityKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = INTENSITY_OPTIONS.length - 1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          selectIntensity(INTENSITY_OPTIONS[nextIndex]);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = index === 0 ? lastIndex : index - 1;
          selectIntensity(INTENSITY_OPTIONS[prevIndex]);
          break;
        }
        case 'Home':
          event.preventDefault();
          selectIntensity(INTENSITY_OPTIONS[0]);
          break;
        case 'End':
          event.preventDefault();
          selectIntensity(INTENSITY_OPTIONS[lastIndex]);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          selectIntensity(INTENSITY_OPTIONS[index]);
          break;
        default:
          break;
      }
    },
    [selectIntensity]
  );

  const handleThemeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = THEME_OPTIONS.length - 1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          selectTheme(THEME_OPTIONS[nextIndex]);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = index === 0 ? lastIndex : index - 1;
          selectTheme(THEME_OPTIONS[prevIndex]);
          break;
        }
        case 'Home':
          event.preventDefault();
          selectTheme(THEME_OPTIONS[0]);
          break;
        case 'End':
          event.preventDefault();
          selectTheme(THEME_OPTIONS[lastIndex]);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          selectTheme(THEME_OPTIONS[index]);
          break;
        default:
          break;
      }
    },
    [selectTheme]
  );

  const handleLanguageKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      const lastIndex = LANGUAGE_OPTIONS.length - 1;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          event.preventDefault();
          const nextIndex = index === lastIndex ? 0 : index + 1;
          selectLanguage(LANGUAGE_OPTIONS[nextIndex]);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          event.preventDefault();
          const prevIndex = index === 0 ? lastIndex : index - 1;
          selectLanguage(LANGUAGE_OPTIONS[prevIndex]);
          break;
        }
        case 'Home':
          event.preventDefault();
          selectLanguage(LANGUAGE_OPTIONS[0]);
          break;
        case 'End':
          event.preventDefault();
          selectLanguage(LANGUAGE_OPTIONS[lastIndex]);
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          selectLanguage(LANGUAGE_OPTIONS[index]);
          break;
        default:
          break;
      }
    },
    [selectLanguage]
  );

  const handleLogout = async () => {
    try {
      await logoutSession(false);
      success('Вы вышли из аккаунта');
      onClose?.();
    } catch {
      warning('Ошибка при выходе из аккаунта');
    }
  };

  const handleOpenAdminPanel = useCallback(() => {
    if (!isAdmin) {
      return;
    }
    void logClientEvent('admin_monetization_open', { source: 'settings' });
    onShowAdminPanel?.();
  }, [isAdmin, onShowAdminPanel]);

  const SelectButton = ({
    label,
    selected,
    onClick,
    onKeyDown,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
    onKeyDown?: (event: ReactKeyboardEvent<HTMLButtonElement>) => void;
  }) => (
    <motion.button
      type="button"
      onClick={onClick}
      onKeyDown={onKeyDown}
      whileTap={{ scale: 0.95 }}
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      className={`px-sm-plus py-xs-plus rounded-2xl font-semibold uppercase tracking-[0.08em] transition-all border focus-ring ${
        selected
          ? 'bg-gradient-to-r from-feedback-success/70 via-accent-cyan/70 to-accent-magenta/70 text-text-primary border-feedback-success/70 shadow-glow-lime'
          : 'bg-surface-glass-strong border-border-cyan/50 text-token-secondary hover:bg-layer-overlay-strong hover:text-token-primary'
      }`}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col gap-md"
    >
      {/* Account Section */}
      <SettingsSection title="Аккаунт" icon="👤">
        {profile ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-token-secondary">Имя:</span>
              <span className="text-token-primary font-medium">
                {profile.user.username || profile.user.first_name || 'Игрок'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-token-secondary">ID:</span>
              <span className="text-token-secondary font-mono text-xs">
                {profile.user.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-token-secondary">Имя:</span>
              <span className="text-token-primary font-medium">{username || 'Игрок'}</span>
            </div>
            {userId && (
              <div className="flex justify-between">
                <span className="text-token-secondary">ID:</span>
                <span className="text-token-secondary font-mono text-xs">
                  {userId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        )}
      </SettingsSection>

      {isAdmin && (
        <Card className="flex flex-col gap-3 border-cyan/40 bg-cyan/5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-token-primary">Админ-панель</span>
              <span className="text-xs text-token-secondary">
                Следите за конверсией upsell, квестов и магазина.
              </span>
            </div>
            <span className="text-lg" aria-hidden="true">
              📊
            </span>
          </div>
          <Button variant="primary" size="md" fullWidth onClick={handleOpenAdminPanel}>
            📈 Монетизация
          </Button>
        </Card>
      )}

      <SettingsSection
        title="Друзья и награды"
        icon="🤝"
        description="Приглашайте друзей и получайте бонусы."
      >
        <ReferralInviteCard />
      </SettingsSection>

      {/* Audio & Sound Section */}
      <SettingsSection title="Звук" icon="🔊" description="Звуковые эффекты игры">
        <div className="flex items-center justify-between">
          <span className="text-sm text-token-secondary">Звуки включены</span>
          <Toggle enabled={soundEnabled} onChange={setSoundEnabled} />
        </div>

        {soundEnabled && (
          <SliderControl
            value={tapSoundVolume}
            onChange={setTapSoundVolume}
            label="Громкость звуков"
          />
        )}
      </SettingsSection>

      {/* Haptic Feedback Section */}
      <SettingsSection title="Вибрация" icon="📳" description="Тактильная обратная связь">
        <div className="flex items-center justify-between">
          <span className="text-sm text-token-secondary">Вибрация включена</span>
          <Toggle enabled={hapticEnabled} onChange={setHapticEnabled} />
        </div>

        {hapticEnabled && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-token-secondary">Интенсивность</label>
            <div
              className="grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-label="Интенсивность вибрации"
            >
              {INTENSITY_OPTIONS.map((intensity, index) => (
                <SelectButton
                  key={intensity}
                  label={
                    intensity === 'light'
                      ? '🪶 Слабая'
                      : intensity === 'medium'
                        ? '👊 Средняя'
                        : '💥 Сильная'
                  }
                  selected={hapticIntensity === intensity}
                  onClick={() => selectIntensity(intensity)}
                  onKeyDown={event => handleIntensityKeyDown(event, index)}
                />
              ))}
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="Уведомления" icon="🔔" description="Оповещения в игре">
        <div className="flex items-center justify-between">
          <span className="text-sm text-token-secondary">Уведомления включены</span>
          <Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-token-secondary">Push-уведомления</span>
          <Toggle
            enabled={pushNotificationsEnabled}
            onChange={setPushNotificationsEnabled}
            disabled={!notificationsEnabled}
          />
        </div>
      </SettingsSection>

      {/* Display Section */}
      <SettingsSection title="Дисплей" icon="🎨" description="Внешний вид и язык">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-token-secondary">Тема оформления</label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Тема оформления">
            {THEME_OPTIONS.map((mode, index) => (
              <SelectButton
                key={mode}
                label={mode === 'light' ? '☀️ Светлая' : mode === 'dark' ? '🌙 Тёмная' : '🤖 Авто'}
                selected={theme === mode}
                onClick={() => selectTheme(mode)}
                onKeyDown={event => handleThemeKeyDown(event, index)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-token-secondary">Язык</label>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Выбор языка">
            {LANGUAGE_OPTIONS.map((lang, index) => (
              <SelectButton
                key={lang}
                label={lang === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
                selected={language === lang}
                onClick={() => selectLanguage(lang)}
                onKeyDown={event => handleLanguageKeyDown(event, index)}
              />
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Accessibility Section */}
      <SettingsSection title="Доступность" icon="♿" description="Параметры для комфорта">
        <div className="flex items-center justify-between">
          <span className="text-sm text-token-secondary">Меньше анимаций</span>
          <Toggle enabled={reduceMotion} onChange={setReduceMotion} />
        </div>
      </SettingsSection>

      {/* Actions Section */}
      <Card className="flex flex-col gap-3">
        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => {
            light();
            resetToDefaults();
            success('Настройки сброшены на значения по умолчанию');
          }}
        >
          ↺ Сбросить настройки
        </Button>
      </Card>

      {/* Logout Section */}
      <Card
        className={`flex flex-col gap-2 ${confirmLogout ? 'border-red-error/40' : 'border-red-error/20'}`}
      >
        {confirmLogout ? (
          <>
            <p className="m-0 text-sm text-red-error">Вы уверены? Это действие нельзя отменить.</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  light();
                  setConfirmLogout(false);
                }}
                fullWidth
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  light();
                  handleLogout();
                }}
                fullWidth
              >
                Выйти
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="danger"
            size="md"
            fullWidth
            onClick={() => {
              light();
              setConfirmLogout(true);
            }}
          >
            🚪 Выйти из аккаунта
          </Button>
        )}
      </Card>

      {/* About Section */}
      <SettingsSection title="О приложении" icon="ℹ️">
        <div className="flex flex-col gap-2 text-xs text-token-secondary">
          <div>Energy Planet v1.0.0</div>
          <div className="text-text-secondary">© 2025 Energy Planet. Все права защищены.</div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              className="text-cyan hover:text-cyan/80 transition-colors underline focus-ring px-0"
              onClick={() => warning('Документ будет опубликован в ближайшее время')}
            >
              Политика приватности
            </button>
            <span className="text-token-secondary opacity-40">•</span>
            <button
              type="button"
              className="text-cyan hover:text-cyan/80 transition-colors underline focus-ring px-0"
              onClick={() => warning('Документ будет опубликован в ближайшее время')}
            >
              Условия использования
            </button>
          </div>
        </div>
      </SettingsSection>
    </motion.div>
  );
};
