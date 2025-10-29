import axios from 'axios';
import { authStore } from '@/store/authStore';
import { uiStore } from '@/store/uiStore';
import { API_BASE_URL } from './apiClient';
import { logClientEvent } from './telemetry';
import { logger } from '@/utils/logger';

type RefreshReason = 'response' | 'proactive' | 'manual';

interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  accessExpiresIn?: number;
  refreshExpiresIn?: number;
}

interface AuthBroadcastMessage {
  type: 'tokens_update' | 'tokens_cleared';
  payload?: TokenPayload;
  source: string;
}

const DEFAULT_ACCESS_TTL_SECONDS = 15 * 60; // fallback 15 minutes

class SessionManager {
  private refreshInFlight: Promise<string | null> | null = null;
  private proactiveTimer: ReturnType<typeof setTimeout> | null = null;
  private accessExpiresAt: number | null = null;
  private refreshExpiresAt: number | null = null;
  private readonly channel: BroadcastChannel | null;
  private readonly instanceId: string;
  private backoffUntil = 0;
  private consecutiveRefreshFailures = 0;

  constructor() {
    this.instanceId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('energyplanet-auth');
      this.channel.addEventListener('message', this.handleChannelMessage);
    } else {
      this.channel = null;
    }
  }

  private handleChannelMessage = (event: MessageEvent<AuthBroadcastMessage>) => {
    const message = event.data;
    if (!message || message.source === this.instanceId) {
      return;
    }

    if (message.type === 'tokens_cleared') {
      this.applyTokenClear({ broadcast: false, reason: 'broadcast' });
      return;
    }

    if (message.type === 'tokens_update' && message.payload) {
      this.applyTokens(message.payload, { broadcast: false, source: 'broadcast' });
    }
  };

  private broadcast(message: AuthBroadcastMessage) {
    if (!this.channel) {
      return;
    }
    this.channel.postMessage({ ...message, source: this.instanceId });
  }

  private clearProactiveTimer() {
    if (this.proactiveTimer) {
      clearTimeout(this.proactiveTimer);
      this.proactiveTimer = null;
    }
  }

  private scheduleProactiveRefresh(expiresInSeconds?: number) {
    this.clearProactiveTimer();
    if (!expiresInSeconds || expiresInSeconds <= 45) {
      return;
    }
    const triggerMs = Math.max((expiresInSeconds - 30) * 1000, 5000);
    this.proactiveTimer = setTimeout(() => {
      void this.refreshAccessToken('proactive');
    }, triggerMs);
  }

  private setExpiryTimers(payload: TokenPayload) {
    const now = Date.now();
    if (typeof payload.accessExpiresIn === 'number') {
      this.accessExpiresAt = now + payload.accessExpiresIn * 1000;
      this.scheduleProactiveRefresh(payload.accessExpiresIn);
    } else if (this.accessExpiresAt) {
      const remaining = Math.max(0, (this.accessExpiresAt - now) / 1000);
      this.scheduleProactiveRefresh(remaining);
    } else {
      this.accessExpiresAt = now + DEFAULT_ACCESS_TTL_SECONDS * 1000;
      this.scheduleProactiveRefresh(DEFAULT_ACCESS_TTL_SECONDS);
    }

    if (typeof payload.refreshExpiresIn === 'number') {
      this.refreshExpiresAt = now + payload.refreshExpiresIn * 1000;
    }
  }

  private applyTokens(
    payload: TokenPayload,
    options: { broadcast?: boolean; source?: string } = {}
  ) {
    if (payload.refreshToken) {
      authStore.setTokens({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      });
    } else {
      authStore.setAccessToken(payload.accessToken);
    }

    this.setExpiryTimers(payload);
    this.consecutiveRefreshFailures = 0;

    if (options.broadcast !== false) {
      this.broadcast({
        type: 'tokens_update',
        payload,
        source: this.instanceId,
      });
    }
  }

  private applyTokenClear(options: { broadcast?: boolean; reason?: string } = {}) {
    this.clearProactiveTimer();
    this.accessExpiresAt = null;
    this.refreshExpiresAt = null;
    authStore.clearTokens();
    if (options.broadcast !== false) {
      this.broadcast({ type: 'tokens_cleared', source: this.instanceId });
    }
    logger.warn('🔐 Tokens cleared', { reason: options.reason });
  }

  syncFromStore() {
    const accessToken = authStore.accessToken;
    const refreshToken = authStore.refreshToken;
    if (accessToken) {
      this.applyTokens(
        {
          accessToken,
          refreshToken: refreshToken ?? undefined,
        },
        { broadcast: false, source: 'hydrate' }
      );
    }
  }

  getAccessToken(): string | null {
    return authStore.accessToken;
  }

  getRefreshToken(): string | null {
    return authStore.refreshToken;
  }

  async refreshAccessToken(reason: RefreshReason = 'response'): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      logger.warn('🔐 No refresh token available, cannot refresh', { reason });
      this.forceReauth('missing_refresh');
      return null;
    }

    if (this.refreshExpiresAt && this.refreshExpiresAt <= Date.now()) {
      logger.warn('🔐 Refresh token expired, forcing reauth');
      this.forceReauth('refresh_expired');
      return null;
    }

    const now = Date.now();
    if (this.backoffUntil > now) {
      const waitMs = this.backoffUntil - now;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    this.refreshInFlight = this.doRefresh(refreshToken, reason)
      .catch(error => {
        throw error;
      })
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  private async doRefresh(refreshToken: string, reason: RefreshReason): Promise<string | null> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      this.applyTokens(
        {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          accessExpiresIn: response.data.expires_in,
          refreshExpiresIn: response.data.refresh_expires_in,
        },
        { source: 'refresh' }
      );

      logClientEvent('refresh_token_success', { reason }, 'info').catch(() => undefined);
      return response.data.access_token as string;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 429) {
          const retryAfterHeader = error.response?.headers?.['retry-after'];
          const retryAfter = this.parseRetryAfter(retryAfterHeader);
          const waitMs = retryAfter ?? 3000;
          this.backoffUntil = Date.now() + waitMs;
          logger.warn('🔄 Refresh rate-limited, backing off', { waitMs });
          await new Promise(resolve => setTimeout(resolve, waitMs));
          return this.doRefresh(refreshToken, reason);
        }

        if (status === 401 || status === 403) {
          logger.error('❌ Refresh token rejected by server', { status });
          this.forceReauth('refresh_rejected');
          return null;
        }
      }

      this.consecutiveRefreshFailures += 1;
      logger.error('❌ Refresh token request failed', {
        reason,
        failures: this.consecutiveRefreshFailures,
        error: axios.isAxiosError(error) ? error.message : String(error),
      });

      if (this.consecutiveRefreshFailures >= 2) {
        this.forceReauth('refresh_failed');
        return null;
      }

      throw error;
    }
  }

  private parseRetryAfter(headerValue: unknown): number | null {
    if (!headerValue) {
      return null;
    }
    const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (typeof value === 'string') {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        return Math.max(1000, numeric * 1000);
      }
      const retryDate = Date.parse(value);
      if (!Number.isNaN(retryDate)) {
        const diff = retryDate - Date.now();
        return diff > 0 ? diff : 1000;
      }
    } else if (typeof value === 'number') {
      return Math.max(1000, value * 1000);
    }
    return null;
  }

  forceReauth(reason: string) {
    this.applyTokenClear({ reason });
    authStore.requestBootstrapRetry();
    uiStore.openAuthError?.('Требуется повторная авторизация. Попробуйте снова.');
    logClientEvent('auth_force_reauth', { reason }, 'warn').catch(() => undefined);
  }

  clearTokens(reason: string) {
    this.applyTokenClear({ reason });
  }

  acceptTokens(payload: TokenPayload) {
    this.applyTokens(payload, { source: 'local' });
  }
}

export const sessionManager = new SessionManager();
