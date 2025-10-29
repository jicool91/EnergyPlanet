import { useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../services/apiClient';
import { getTmaInitData } from '@/services/tma/initData';
import { useAuthStore } from '../store/authStore';
import { uiStore } from '../store/uiStore';
import { logClientEvent } from '../services/telemetry';
import { logger } from '../utils/logger';
import { sessionManager } from '@/services/sessionManager';

export function useAuthBootstrap() {
  const hydrated = useAuthStore(state => state.hydrated);
  const authReady = useAuthStore(state => state.authReady);
  const accessToken = useAuthStore(state => state.accessToken);
  const refreshToken = useAuthStore(state => state.refreshToken);
  const bootstrapping = useAuthStore(state => state.bootstrapping);
  const bootstrapNonce = useAuthStore(state => state.bootstrapNonce);
  const setBootstrapping = useAuthStore(state => state.setBootstrapping);
  const setAuthReady = useAuthStore(state => state.setAuthReady);

  const hasShownErrorRef = useRef(false);
  const hasAttemptedOnceRef = useRef(false);
  const authRetryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const MAX_AUTH_RETRIES = 3;
  const INITIAL_RETRY_DELAY_MS = 2000; // 2 seconds

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const authenticateWithTelegramWithRetry = async (
      maxRetries = MAX_AUTH_RETRIES
    ): Promise<void> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const initData = getTmaInitData();
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

          if (!isMountedRef.current) {
            return;
          }

          const tokens = {
            accessToken: response.data.access_token as string,
            refreshToken: response.data.refresh_token as string,
            accessExpiresIn: Number(response.data.expires_in),
            refreshExpiresIn: Number(response.data.refresh_expires_in),
          };

          logger.info('🔐 Tokens received from /auth/tma', {
            accessTokenLength: tokens.accessToken?.length || 0,
            refreshTokenLength: tokens.refreshToken?.length || 0,
            attempt,
            replayStatus: response.data.replay_status,
          });

          sessionManager.acceptTokens(tokens);

          void logClientEvent(
            'auth_tokens_set',
            {
              hasAccessToken: !!tokens.accessToken,
              hasRefreshToken: !!tokens.refreshToken,
              accessTokenLength: tokens.accessToken?.length || 0,
              attempt,
              replay_status: response.data.replay_status,
            },
            'info'
          );

          setBootstrapping(false);
          return;
        } catch (error) {
          if (!isMountedRef.current) {
            return;
          }

          // Handle 409: initData already used in Redis within TTL window
          if (axios.isAxiosError(error) && error.response?.status === 409) {
            const errorCode =
              typeof error.response.data === 'object' &&
              error.response.data !== null &&
              'error' in error.response.data &&
              typeof (error.response.data as { error?: unknown }).error === 'string'
                ? (error.response.data as { error: string }).error
                : undefined;
            if (errorCode === 'telegram_initdata_replayed') {
              logger.warn('⚠️ Telegram initData replayed (409), retrying...', {
                attempt,
                maxRetries,
              });

              // This is expected in edge cases (fast retries, network issues)
              // Wait for TTL to pass or Telegram to generate new initData
              authRetryCountRef.current = attempt;

              if (attempt < maxRetries) {
                // Exponential backoff: 2s, 4s, 8s
                const delayMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                logger.info(`⏳ Waiting ${delayMs}ms before retry ${attempt + 1}/${maxRetries}`);
                await sleep(delayMs);
                continue; // Retry with fresh initData
              } else {
                // All retries exhausted
                logger.error('❌ Telegram initData replayed - max retries exceeded');
                const err = new Error('telegram_initdata_replayed_max_retries');
                throw err;
              }
            }
          }

          // Other errors should be rethrown
          if (axios.isAxiosError(error)) {
            logger.error('❌ /auth/tma request failed', {
              status: error.response?.status,
              message: error.message,
              attempt,
            });
          } else {
            logger.error('❌ Authentication error', {
              error: error instanceof Error ? error.message : 'unknown',
              attempt,
            });
          }
          throw error;
        }
      }

      throw new Error('Authentication failed: max retries exceeded');
    };

    const bootstrap = async () => {
      try {
        if (accessToken) {
          logger.info('✅ Access token already available');
          if (isMountedRef.current) {
            setAuthReady(true);
            setBootstrapping(false);
          }
          return;
        }

        if (refreshToken) {
          try {
            logger.info('🔄 Attempting to refresh access token');
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            if (!isMountedRef.current) {
              return;
            }

            const refreshedTokens = {
              accessToken: response.data.access_token as string,
              refreshToken: response.data.refresh_token as string,
              accessExpiresIn: Number(response.data.expires_in),
              refreshExpiresIn: Number(response.data.refresh_expires_in),
            };

            logger.info('✅ Access token refreshed successfully', {
              accessTokenLength: refreshedTokens.accessToken?.length || 0,
            });

            sessionManager.acceptTokens(refreshedTokens);

            void logClientEvent(
              'refresh_token_success',
              {
                hasAccessToken: !!refreshedTokens.accessToken,
                accessTokenLength: refreshedTokens.accessToken?.length || 0,
              },
              'info'
            );

            setBootstrapping(false);
            return;
          } catch (refreshError) {
            logger.warn('⚠️ Refresh token invalid or expired, authenticating with Telegram', {
              error: refreshError instanceof Error ? refreshError.message : 'unknown',
            });
            // Refresh token is invalid or expired - fall through to TMA auth
            sessionManager.clearTokens('refresh_invalid');
            await authenticateWithTelegramWithRetry();
          }
        } else {
          logger.info('📝 No tokens available, authenticating with Telegram initData');
          // No tokens available - authenticate with Telegram initData
          await authenticateWithTelegramWithRetry();
        }
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        logger.error('❌ Bootstrap failed', {
          error: error instanceof Error ? error.message : String(error),
          retries: authRetryCountRef.current,
        });

        sessionManager.clearTokens('bootstrap_failed');
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
              logger.error('❌ init_data_missing');
            } else if (error.message.includes('telegram_initdata_replayed')) {
              message = 'Слишком много попыток входа. Подождите и попробуйте снова.';
              errorType = 'auth_replay_protection_triggered';
              logger.error('❌ Replay protection triggered');
            }
          }

          logger.info('📢 Showing auth error to user', { message, errorType });
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
  }, [
    hydrated,
    authReady,
    accessToken,
    refreshToken,
    bootstrapping,
    bootstrapNonce,
    setBootstrapping,
    setAuthReady,
  ]);
}
