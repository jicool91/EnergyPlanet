import { useState } from 'react';
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

interface SettingsScreenProps {
  onClose?: () => void;
}

/**
 * SettingsScreen Component
 * Displays game settings, preferences, and account information
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { profile, userId, username, logoutSession } = useGameStore(state => ({
    profile: state.profile,
    userId: state.userId,
    username: state.username,
    logoutSession: state.logoutSession,
  }));
  const { success, warning } = useNotification();
  const { light } = useHaptic();
  const [confirmLogout, setConfirmLogout] = useState(false);

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

  const handleLogout = async () => {
    try {
      await logoutSession(false);
      success('Вы вышли из аккаунта');
      onClose?.();
    } catch (error) {
      warning('Ошибка при выходе из аккаунта');
    }
  };

  const SelectButton = ({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`py-2 rounded-lg font-medium transition-all ${
        selected
          ? 'bg-lime text-black shadow-lg'
          : 'bg-dark-tertiary border border-cyan/[0.14] text-white/70 hover:bg-dark-secondary'
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
      className="flex flex-col gap-4 pb-6"
    >
      {/* Account Section */}
      <SettingsSection title="Аккаунт" icon="👤">
        {profile ? (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Имя:</span>
              <span className="text-white font-medium">
                {profile.user.username || profile.user.first_name || 'Игрок'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">ID:</span>
              <span className="text-white/80 font-mono text-xs">
                {profile.user.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Имя:</span>
              <span className="text-white font-medium">{username || 'Игрок'}</span>
            </div>
            {userId && (
              <div className="flex justify-between">
                <span className="text-white/60">ID:</span>
                <span className="text-white/80 font-mono text-xs">{userId.slice(0, 8)}...</span>
              </div>
            )}
          </div>
        )}
      </SettingsSection>

      {/* Audio & Sound Section */}
      <SettingsSection title="Звук" icon="🔊" description="Звуковые эффекты игры">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Звуки включены</span>
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
          <span className="text-sm text-white/80">Вибрация включена</span>
          <Toggle enabled={hapticEnabled} onChange={setHapticEnabled} />
        </div>

        {hapticEnabled && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/80">Интенсивность</label>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'medium', 'strong'] as const).map(intensity => (
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
                  onClick={() => {
                    light();
                    setHapticIntensity(intensity);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Notifications Section */}
      <SettingsSection title="Уведомления" icon="🔔" description="Оповещения в игре">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Уведомления включены</span>
          <Toggle enabled={notificationsEnabled} onChange={setNotificationsEnabled} />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Push-уведомления</span>
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
          <label className="text-sm font-medium text-white/80">Тема оформления</label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'auto'] as ThemeMode[]).map(t => (
              <SelectButton
                key={t}
                label={t === 'light' ? '☀️ Светлая' : t === 'dark' ? '🌙 Тёмная' : '🤖 Авто'}
                selected={theme === t}
                onClick={() => {
                  light();
                  setTheme(t);
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white/80">Язык</label>
          <div className="grid grid-cols-2 gap-2">
            {(['ru', 'en'] as Language[]).map(lang => (
              <SelectButton
                key={lang}
                label={lang === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
                selected={language === lang}
                onClick={() => {
                  light();
                  setLanguage(lang);
                }}
              />
            ))}
          </div>
        </div>
      </SettingsSection>

      {/* Accessibility Section */}
      <SettingsSection title="Доступность" icon="♿" description="Параметры для комфорта">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Меньше анимаций</span>
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
        <div className="flex flex-col gap-2 text-xs text-white/60">
          <div>Energy Planet v1.0.0</div>
          <div className="text-[var(--color-text-secondary)]">
            © 2025 Energy Planet. Все права защищены.
          </div>
          <div className="flex gap-2 mt-2">
            <a href="#privacy" className="text-cyan hover:text-cyan/80 transition-colors underline">
              Политика приватности
            </a>
            <span className="text-white/20">•</span>
            <a href="#terms" className="text-cyan hover:text-cyan/80 transition-colors underline">
              Условия использования
            </a>
          </div>
        </div>
      </SettingsSection>
    </motion.div>
  );
};
