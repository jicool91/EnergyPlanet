import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { usePreferencesStore, type ThemeMode, type Language } from '../../store/preferencesStore';
import { useNotification } from '../../hooks/useNotification';
import { useHaptic } from '../../hooks/useHaptic';
import { Toggle } from './Toggle';
import { SliderControl } from './SliderControl';
import { SettingsSection } from './SettingsSection';

interface SettingsScreenProps {
  onClose?: () => void;
}

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
                <motion.button
                  key={intensity}
                  onClick={() => {
                    light();
                    setHapticIntensity(intensity);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className={`py-2 rounded-lg font-medium transition-all ${
                    hapticIntensity === intensity
                      ? 'bg-lime-500 text-black shadow-lg'
                      : 'bg-dark-card border border-cyan/[0.14] text-white/70'
                  }`}
                >
                  {intensity === 'light'
                    ? '🪶 Слабая'
                    : intensity === 'medium'
                      ? '👊 Средняя'
                      : '💥 Сильная'}
                </motion.button>
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
              <motion.button
                key={t}
                onClick={() => {
                  light();
                  setTheme(t);
                }}
                whileTap={{ scale: 0.95 }}
                className={`py-2 rounded-lg font-medium transition-all ${
                  theme === t
                    ? 'bg-lime-500 text-black shadow-lg'
                    : 'bg-dark-card border border-cyan/[0.14] text-white/70'
                }`}
              >
                {t === 'light' ? '☀️ Светлая' : t === 'dark' ? '🌙 Тёмная' : '🤖 Авто'}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-white/80">Язык</label>
          <div className="grid grid-cols-2 gap-2">
            {(['ru', 'en'] as Language[]).map(lang => (
              <motion.button
                key={lang}
                onClick={() => {
                  light();
                  setLanguage(lang);
                }}
                whileTap={{ scale: 0.95 }}
                className={`py-2 rounded-lg font-medium transition-all ${
                  language === lang
                    ? 'bg-lime-500 text-black shadow-lg'
                    : 'bg-dark-card border border-cyan/[0.14] text-white/70'
                }`}
              >
                {lang === 'ru' ? '🇷🇺 Русский' : '🇬🇧 English'}
              </motion.button>
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
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-dark-secondary border border-cyan/[0.14]">
        <motion.button
          onClick={() => {
            light();
            resetToDefaults();
            success('Настройки сброшены на значения по умолчанию');
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-lg bg-dark-card hover:bg-dark-card/80 text-white/80 font-medium transition-colors border border-white/10"
        >
          ↺ Сбросить настройки
        </motion.button>
      </div>

      {/* Logout Section */}
      <div className="flex flex-col gap-2 p-4 rounded-lg bg-dark-secondary border border-red-error/30">
        {confirmLogout ? (
          <>
            <p className="m-0 text-sm text-red-error">Вы уверены? Это действие нельзя отменить.</p>
            <div className="flex gap-2">
              <motion.button
                onClick={() => {
                  light();
                  setConfirmLogout(false);
                }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
              >
                Отмена
              </motion.button>
              <motion.button
                onClick={() => {
                  light();
                  handleLogout();
                }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 py-2 rounded-lg bg-red-error hover:bg-red-error/90 text-white font-medium transition-colors"
              >
                Выйти
              </motion.button>
            </div>
          </>
        ) : (
          <motion.button
            onClick={() => {
              light();
              setConfirmLogout(true);
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-lg bg-red-error/20 hover:bg-red-error/30 text-red-error font-medium transition-colors border border-red-error/40"
          >
            🚪 Выйти из аккаунта
          </motion.button>
        )}
      </div>

      {/* About Section */}
      <SettingsSection title="О приложении" icon="ℹ️">
        <div className="flex flex-col gap-2 text-xs text-white/60">
          <div>Energy Planet v1.0.0</div>
          <div className="text-white/40">© 2025 Energy Planet. Все права защищены.</div>
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
