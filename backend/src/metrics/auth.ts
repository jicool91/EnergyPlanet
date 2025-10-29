import client from 'prom-client';
import { metricsEnabled, register } from './index';

type AuthEndpoint = 'tma' | 'refresh' | 'telegram' | 'other';
type AuthOutcome = 'success' | 'error' | 'rate_limited';

const authRequestCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_auth_requests_total',
      help: 'Количество запросов к auth-эндпоинтам по статусу',
      labelNames: ['endpoint', 'status', 'outcome'] as const,
      registers: [register],
    })
  : null;

const refreshAuditCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_auth_refresh_audit_total',
      help: 'Аудит причин отказа при обновлении refresh токена',
      labelNames: ['reason', 'revocation_reason'] as const,
      registers: [register],
    })
  : null;

const sessionFamilyRevokedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_auth_session_family_revoked_total',
      help: 'Количество ревокаций семейств refresh-токенов',
      labelNames: ['trigger'] as const,
      registers: [register],
    })
  : null;

export function recordAuthRequestMetric(
  endpoint: AuthEndpoint,
  statusCode: number,
  outcome?: AuthOutcome
) {
  if (!authRequestCounter) {
    return;
  }

  const resolvedOutcome: AuthOutcome =
    outcome ?? (statusCode >= 200 && statusCode < 400 ? 'success' : 'error');

  authRequestCounter.inc({
    endpoint,
    status: String(statusCode),
    outcome: resolvedOutcome,
  });
}

export function recordRefreshAuditMetric(reason: string, revocationReason?: string | null) {
  if (!refreshAuditCounter) {
    return;
  }

  refreshAuditCounter.inc({
    reason,
    revocation_reason: revocationReason ?? 'none',
  });
}

export function recordSessionFamilyRevocationMetric(trigger: string, count: number) {
  if (!sessionFamilyRevokedCounter || count <= 0) {
    return;
  }

  sessionFamilyRevokedCounter.inc({ trigger }, count);
}

export const authMetrics = {
  recordAuthRequestMetric,
  recordRefreshAuditMetric,
  recordSessionFamilyRevocationMetric,
};
