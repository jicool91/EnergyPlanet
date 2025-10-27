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

function persist(key: string, value: string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
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
    if (typeof window === 'undefined') {
      return;
    }
    const access = window.localStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh = window.localStorage.getItem(REFRESH_TOKEN_KEY);
    set({ accessToken: access, refreshToken: refresh, hydrated: true, authReady: false });
  },
  setTokens: ({ accessToken, refreshToken }) => {
    logger.info('🔐 setTokens called', {
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken.length,
    });
    persist(ACCESS_TOKEN_KEY, accessToken);
    persist(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken, authReady: true });
    logger.info('✅ authReady set to true (via setTokens)');
  },
  setAccessToken: (token: string) => {
    logger.info('🔐 setAccessToken called', {
      tokenLength: token.length,
    });
    persist(ACCESS_TOKEN_KEY, token);
    set({ accessToken: token, authReady: true });
    logger.info('✅ authReady set to true (via setAccessToken)');
  },
  clearTokens: () => {
    logger.warn('🗑️ clearTokens called - clearing all tokens');
    persist(ACCESS_TOKEN_KEY, null);
    persist(REFRESH_TOKEN_KEY, null);
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
