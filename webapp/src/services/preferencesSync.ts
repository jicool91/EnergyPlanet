import { cloudStorageGetItem, cloudStorageSetItem } from '@/services/tma/cloudStorage';
import { getTmaRuntimeSnapshot } from '@/tma/runtimeState';
import { usePreferencesStore } from '../store/preferencesStore';

const CLOUD_PREFERENCES_KEY = 'preferences_v1';
let syncInitialized = false;

type PreferencesState = ReturnType<typeof usePreferencesStore.getState>;

function serializePreferences(state: PreferencesState): string {
  const payload = {
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

  return JSON.stringify(payload);
}

function applyPreferencesPatch(serialized: string | null | undefined) {
  if (!serialized) {
    return;
  }

  try {
    const parsed = JSON.parse(serialized) as Partial<PreferencesState>;
    usePreferencesStore.setState(parsed);
  } catch (error) {
    console.warn('Failed to parse preferences from CloudStorage', error);
  }
}

export async function initializePreferenceCloudSync(): Promise<void> {
  if (syncInitialized || !getTmaRuntimeSnapshot()?.cloudStorage?.isSupported()) {
    return;
  }

  syncInitialized = true;

  try {
    const cloudValue = await cloudStorageGetItem(CLOUD_PREFERENCES_KEY);
    applyPreferencesPatch(cloudValue);
  } catch (error) {
    console.warn('Failed to load preferences from CloudStorage', error);
  }

  let pending = false;
  usePreferencesStore.subscribe(state => {
    if (!getTmaRuntimeSnapshot()?.cloudStorage?.isSupported()) {
      return;
    }

    if (pending) {
      return;
    }

    pending = true;
    queueMicrotask(async () => {
      try {
        await cloudStorageSetItem(CLOUD_PREFERENCES_KEY, serializePreferences(state));
      } catch (error) {
        console.warn('Failed to write preferences to CloudStorage', error);
      } finally {
        pending = false;
      }
    });
  });
}
