import { useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiClient';
import { getTelegramInitData } from '../services/telegram';
import { useAuthStore, authStore } from '../store/authStore';
import { uiStore } from '../store/uiStore';
import { logClientEvent } from '../services/telemetry';

export function useAuthBootstrap() {
  const hydrated = useAuthStore(state => state.hydrated);
  const authReady = useAuthStore(state => state.authReady);
  const accessToken = useAuthStore(state => state.accessToken);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const bootstrapping = useAuthStore(state => state.bootstrapping);
  const bootstrapNonce = useAuthStore(state => state.bootstrapNonce);
  const setBootstrapping = useAuthStore(state => state.setBootstrapping);
  const setAuthReady = useAuthStore(state => state.setAuthReady);
  const setTokens = useAuthStore(state => state.setTokens);

  const hasShownErrorRef = useRef(false);
  const hasAttemptedOnceRef = useRef(false);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (authReady) {
      return;
    }

    if (bootstrapping) {
      return;
    }

    if (bootstrapNonce === 0 && hasAttemptedOnceRef.current) {
      return;
    }

    hasAttemptedOnceRef.current = true;
    setBootstrapping(true);
    hasShownErrorRef.current = false;

    let cancelled = false;

    const bootstrap = async () => {
      try {
        if (accessToken) {
          if (!cancelled) {
            setAuthReady(true);
            setBootstrapping(false);
          }
          return;
        }

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          if (cancelled) {
            return;
          }

          setTokens({
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          });
          setAuthReady(true);
          setBootstrapping(false);
          return;
        }

        const initData = getTelegramInitData();
        if (!initData) {
          throw new Error('init_data_missing');
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/tma`,
          {},
          {
            headers: {
              Authorization: `tma ${initData}`,
            },
          }
        );

        if (cancelled) {
          return;
        }

        setTokens({
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
        });
        setAuthReady(true);
        setBootstrapping(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 409) {
          const errorCode = (error.response.data as any)?.error;
          if (errorCode === 'telegram_initdata_replayed') {
            setAuthReady(true);
            setBootstrapping(false);
            return;
          }
        }

        authStore.clearTokens();
        setAuthReady(false);
        setBootstrapping(false);

        if (!hasShownErrorRef.current) {
          hasShownErrorRef.current = true;
          const message = 'Не удалось авторизоваться. Попробуйте ещё раз.';
          uiStore.openAuthError(message);
          void logClientEvent(
            'auth_bootstrap_failed',
            {
              message,
            },
            'error'
          );
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [
    hydrated,
    authReady,
    accessToken,
    refreshToken,
    bootstrapping,
    bootstrapNonce,
    setBootstrapping,
    setAuthReady,
    setTokens,
  ]);
}
