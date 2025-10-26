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
  const authRetryCountRef = useRef(0);
  const MAX_AUTH_RETRIES = 3;
  const INITIAL_RETRY_DELAY_MS = 2000; // 2 seconds

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
    authRetryCountRef.current = 0;

    let cancelled = false;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const authenticateWithTelegramWithRetry = async (maxRetries = MAX_AUTH_RETRIES): Promise<void> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
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

          const tokens = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
          };

          void logClientEvent(
            'auth_tokens_set',
            {
              hasAccessToken: !!tokens.accessToken,
              hasRefreshToken: !!tokens.refreshToken,
              accessTokenLength: tokens.accessToken?.length || 0,
              attempt,
            },
            'info'
          );

          setTokens(tokens);
          setBootstrapping(false);
          return;
        } catch (error) {
          if (cancelled) {
            return;
          }

          // Handle 409: initData already used in Redis within TTL window
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            const errorCode = (error.response.data as any)?.error;
            if (errorCode === 'telegram_initdata_replayed') {
              // This is expected in edge cases (fast retries, network issues)
              // Wait for TTL to pass or Telegram to generate new initData
              authRetryCountRef.current = attempt;

              if (attempt < maxRetries) {
                // Exponential backoff: 2s, 4s, 8s
                const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                await sleep(delayMs);
                continue; // Retry with fresh initData
              } else {
                // All retries exhausted
                const err = new Error('telegram_initdata_replayed_max_retries');
                throw err;
              }
            }
          }

          // Other errors should be rethrown
          throw error;
        }
      }

      throw new Error('Authentication failed: max retries exceeded');
    };

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
          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            if (cancelled) {
              return;
            }

            const refreshedTokens = {
              accessToken: response.data.access_token,
              refreshToken: response.data.refresh_token,
            };

            void logClientEvent(
              'refresh_token_success',
              {
                hasAccessToken: !!refreshedTokens.accessToken,
                accessTokenLength: refreshedTokens.accessToken?.length || 0,
              },
              'info'
            );

            setTokens(refreshedTokens);
            setBootstrapping(false);
            return;
          } catch (refreshError) {
            // Refresh token is invalid or expired - fall through to TMA auth
            authStore.clearTokens();
            await authenticateWithTelegramWithRetry();
          }
        } else {
          // No tokens available - authenticate with Telegram initData
          await authenticateWithTelegramWithRetry();
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        authStore.clearTokens();
        setAuthReady(false);
        setBootstrapping(false);

        if (!hasShownErrorRef.current) {
          hasShownErrorRef.current = true;
          let message = 'Не удалось авторизоваться. Попробуйте ещё раз.';
          let errorType = 'auth_bootstrap_failed';

          if (error instanceof Error) {
            if (error.message === 'init_data_missing') {
              message = 'Telegram Mini App не инициализирован. Откройте приложение через Telegram.';
              errorType = 'auth_init_data_missing';
            } else if (error.message.includes('telegram_initdata_replayed')) {
              message = 'Слишком много попыток входа. Подождите и попробуйте снова.';
              errorType = 'auth_replay_protection_triggered';
            }
          }

          uiStore.openAuthError(message);
          void logClientEvent(
            errorType,
            {
              message,
              retryAttempts: authRetryCountRef.current,
              errorDetails: error instanceof Error ? error.message : String(error),
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
