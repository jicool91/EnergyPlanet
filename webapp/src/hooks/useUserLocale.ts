import { useMemo } from 'react';
import { usePreferencesStore, type Language } from '@/store/preferencesStore';

interface UserLocaleInfo {
  language: Language;
  localeTag: 'ru-RU' | 'en-US';
}

/**
 * Returns the currently selected application language and corresponding BCP-47 locale tag.
 * Falls back to Russian when the preference store is unavailable (e.g., during SSR).
 */
export function useUserLocale(): UserLocaleInfo {
  const language = usePreferencesStore(state => state.language);

  const resolved = useMemo<UserLocaleInfo>(() => {
    const normalized: Language = language === 'en' ? 'en' : 'ru';
    return {
      language: normalized,
      localeTag: normalized === 'en' ? 'en-US' : 'ru-RU',
    };
  }, [language]);

  return resolved;
}
