import { useCallback } from 'react';
import { usePreferencesStore } from '../store/preferencesStore';
import { useAppReducedMotion } from './useAppReducedMotion';

type HapticPattern = 'tap' | 'success' | 'error' | 'warning' | 'light' | 'medium' | 'strong';

/**
 * Hook for haptic feedback (vibration)
 * Uses navigator.vibrate() API which works on Android and some iOS devices
 * Respects user preferences
 */
export function useHaptic() {
  const { hapticEnabled, hapticIntensity } = usePreferencesStore();
  const reduceMotion = useAppReducedMotion();

  const checkSupport = useCallback(() => {
    if (!hapticEnabled || reduceMotion) return false;
    return 'vibrate' in navigator;
  }, [hapticEnabled, reduceMotion]);

  const trigger = useCallback(
    (pattern: HapticPattern) => {
      if (!checkSupport()) return;

      let vibration: number | number[];

      switch (pattern) {
        // Light patterns
        case 'tap':
          vibration = hapticIntensity === 'light' ? 8 : hapticIntensity === 'medium' ? 15 : 25;
          break;
        case 'light':
          vibration = 10;
          break;

        // Medium patterns (success, button press)
        case 'success':
        case 'medium':
          if (hapticIntensity === 'light') {
            vibration = [8, 15];
          } else if (hapticIntensity === 'medium') {
            vibration = [12, 20, 12];
          } else {
            vibration = [15, 25, 15];
          }
          break;

        // Strong patterns (error, warning)
        case 'error':
        case 'strong':
          if (hapticIntensity === 'light') {
            vibration = [15, 30];
          } else if (hapticIntensity === 'medium') {
            vibration = [20, 30, 20];
          } else {
            vibration = [30, 40, 30];
          }
          break;

        case 'warning':
          if (hapticIntensity === 'light') {
            vibration = [10, 20];
          } else if (hapticIntensity === 'medium') {
            vibration = [15, 25, 15];
          } else {
            vibration = [20, 30, 20];
          }
          break;

        default:
          vibration = 10;
      }

      try {
        navigator.vibrate(vibration);
      } catch (error) {
        // Silently fail if vibration not supported
        console.debug('Haptic feedback not supported:', error);
      }
    },
    [checkSupport, hapticIntensity]
  );

  const tapVibrate = useCallback(() => trigger('tap'), [trigger]);
  const successVibrate = useCallback(() => trigger('success'), [trigger]);
  const errorVibrate = useCallback(() => trigger('error'), [trigger]);
  const warningVibrate = useCallback(() => trigger('warning'), [trigger]);
  const lightVibrate = useCallback(() => trigger('light'), [trigger]);
  const mediumVibrate = useCallback(() => trigger('medium'), [trigger]);
  const strongVibrate = useCallback(() => trigger('strong'), [trigger]);

  return {
    trigger,
    tap: tapVibrate,
    success: successVibrate,
    error: errorVibrate,
    warning: warningVibrate,
    light: lightVibrate,
    medium: mediumVibrate,
    strong: strongVibrate,
    isSupported: checkSupport(),
  };
}
