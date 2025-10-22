import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type Language = 'ru' | 'en';

export interface Preferences {
  // Audio & Sound
  soundEnabled: boolean;
  tapSoundVolume: number; // 0-100

  // Haptic Feedback
  hapticEnabled: boolean;
  hapticIntensity: 'light' | 'medium' | 'strong'; // 0-100

  // Notifications
  notificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;

  // Display
  theme: ThemeMode;
  language: Language;

  // Accessibility
  reduceMotion: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  soundEnabled: true,
  tapSoundVolume: 80,
  hapticEnabled: true,
  hapticIntensity: 'medium',
  notificationsEnabled: true,
  pushNotificationsEnabled: true,
  theme: 'auto',
  language: 'ru',
  reduceMotion: false,
};

interface PreferencesState extends Preferences {
  resetToDefaults: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setTapSoundVolume: (volume: number) => void;
  setHapticEnabled: (enabled: boolean) => void;
  setHapticIntensity: (intensity: 'light' | 'medium' | 'strong') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setReduceMotion: (reduce: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      resetToDefaults: () => set(DEFAULT_PREFERENCES),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setTapSoundVolume: (volume) => set({ tapSoundVolume: Math.min(100, Math.max(0, volume)) }),
      setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
      setHapticIntensity: (intensity) => set({ hapticIntensity: intensity }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setPushNotificationsEnabled: (enabled) => set({ pushNotificationsEnabled: enabled }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setReduceMotion: (reduce) => set({ reduceMotion: reduce }),
    }),
    {
      name: 'energyplanet-preferences',
      version: 1,
    }
  )
);

// Convenience export for non-hook usage
export const preferencesStore = {
  getPreferences(): Preferences {
    const state = usePreferencesStore.getState();
    return {
      soundEnabled: state.soundEnabled,
      tapSoundVolume: state.tapSoundVolume,
      hapticEnabled: state.hapticEnabled,
      hapticIntensity: state.hapticIntensity,
      notificationsEnabled: state.notificationsEnabled,
      pushNotificationsEnabled: state.pushNotificationsEnabled,
      theme: state.theme,
      language: state.language,
      reduceMotion: state.reduceMotion,
    };
  },
};
