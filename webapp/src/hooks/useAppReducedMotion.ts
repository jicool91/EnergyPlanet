import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { usePreferencesStore } from '@/store/preferencesStore';

/**
 * Combines the OS-level `prefers-reduced-motion` flag with the in-app accessibility toggle.
 * Returns true if motion should be minimized.
 */
export const useAppReducedMotion = (): boolean => {
  const systemReducedMotion = useFramerReducedMotion();
  const userReducedMotion = usePreferencesStore(state => state.reduceMotion);
  return Boolean(systemReducedMotion || userReducedMotion);
};
