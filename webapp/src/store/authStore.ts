import { create } from 'zustand';
import { logger } from '../utils/logger';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  authReady: boolean;
  bootstrapping: boolean;
  bootstrapNonce: number;
  hydrate: () => void;
  setTokens: (tokens: AuthTokens) => void;
  setAccessToken: (token: string) => void;
  clearTokens: () => void;
  getAuthHeaders: () => Record<string, string>;
  setAuthReady: (ready: boolean) => void;
  setBootstrapping: (value: boolean) => void;
  requestBootstrapRetry: () => void;
}

const getStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const storage = window.localStorage;
    const probeKey = '__energyplanet_auth_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch (error) {
    logger.warn('localStorage unavailable, using in-memory auth storage', { error });
    return null;
  }
};

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
  };
})();

function storageGetItem(key: string): string | null {
  const storage = getStorage();
  try {
    if (storage) {
      return storage.getItem(key);
    }
    return memoryStorage.getItem(key);
  } catch (error) {
    logger.warn('storageGetItem failed, falling back to memory', { error });
    return memoryStorage.getItem(key);
  }
}

function storageSetItem(key: string, value: string | null) {
  const storage = getStorage();
  try {
    if (value === null) {
      if (storage) {
        storage.removeItem(key);
      } else {
        memoryStorage.removeItem(key);
      }
      return;
    }
    if (storage) {
      storage.setItem(key, value);
    } else {
      memoryStorage.setItem(key, value);
    }
  } catch (error) {
    logger.warn('storageSetItem failed, storing in memory only', { error });
    if (value === null) {
      memoryStorage.removeItem(key);
    } else {
      memoryStorage.setItem(key, value);
    }
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  authReady: false,
  bootstrapping: false,
  bootstrapNonce: 0,
  hydrate: () => {
    const access = storageGetItem(ACCESS_TOKEN_KEY);
    const refresh = storageGetItem(REFRESH_TOKEN_KEY);
    set({ accessToken: access, refreshToken: refresh, hydrated: true, authReady: false });
  },
  setTokens: ({ accessToken, refreshToken }) => {
    logger.info('🔐 setTokens called', {
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
    });
    storageSetItem(ACCESS_TOKEN_KEY, accessToken);
    storageSetItem(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken, authReady: true });
    logger.info('✅ authReady set to true (via setTokens)');
  },
  setAccessToken: (token: string) => {
    logger.info('🔐 setAccessToken called', {
      tokenLength: token.length,
    });
    storageSetItem(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token, authReady: true });
    logger.info('✅ authReady set to true (via setAccessToken)');
  },
  clearTokens: () => {
    logger.warn('🗑️ clearTokens called - clearing all tokens');
    storageSetItem(ACCESS_TOKEN_KEY, null);
    storageSetItem(REFRESH_TOKEN_KEY, null);
    set({ accessToken: null, refreshToken: null, authReady: false });
  },
  getAuthHeaders: () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = get().accessToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },
  setAuthReady: ready => {
    logger.info(`${ready ? '✅' : '❌'} setAuthReady called`, {
      ready,
      hasAccessToken: !!get().accessToken,
    });
    set({ authReady: ready });
  },
  setBootstrapping: value => {
    set({ bootstrapping: value });
  },
  requestBootstrapRetry: () => {
    set(state => ({ bootstrapNonce: state.bootstrapNonce + 1 }));
  },
}));

export const authStore = {
  get accessToken() {
    return useAuthStore.getState().accessToken;
  },
  get refreshToken() {
    return useAuthStore.getState().refreshToken;
  },
  setTokens(tokens: AuthTokens) {
    useAuthStore.getState().setTokens(tokens);
  },
  setAccessToken(token: string) {
    useAuthStore.getState().setAccessToken(token);
  },
  clearTokens() {
    useAuthStore.getState().clearTokens();
  },
  hydrate() {
    useAuthStore.getState().hydrate();
  },
  getAuthHeaders() {
    return useAuthStore.getState().getAuthHeaders();
  },
  get authReady() {
    return useAuthStore.getState().authReady;
  },
  setAuthReady(ready: boolean) {
    useAuthStore.getState().setAuthReady(ready);
  },
  get bootstrapping() {
    return useAuthStore.getState().bootstrapping;
  },
  setBootstrapping(value: boolean) {
    useAuthStore.getState().setBootstrapping(value);
  },
  requestBootstrapRetry() {
    useAuthStore.getState().requestBootstrapRetry();
  },
  get bootstrapNonce() {
    return useAuthStore.getState().bootstrapNonce;
  },
};
