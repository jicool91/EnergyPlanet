import client from 'prom-client';
import { metricsEnabled, register } from './index';

type ReplayStatus = 'fresh' | 'replay' | 'skipped';

const loginCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_user_logins_total',
      help: 'Total successful Telegram logins grouped by user segment',
      labelNames: ['is_new_user', 'replay_status'] as const,
      registers: [register],
    })
  : null;

const sessionRotationCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_session_rotations_total',
      help: 'Total session token rotations grouped by reason',
      labelNames: ['reason'] as const,
      registers: [register],
    })
  : null;

const purchaseInvoiceCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_purchase_invoices_total',
      help: 'Count of purchase invoice attempts',
      labelNames: ['purchase_type', 'status'] as const,
      registers: [register],
    })
  : null;

const purchaseConflictCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_purchase_conflicts_total',
      help: 'Count of purchase invoice conflicts and failures',
      labelNames: ['reason'] as const,
      registers: [register],
    })
  : null;

const purchaseCompletedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_purchase_completed_total',
      help: 'Count of completed purchases grouped by type and item',
      labelNames: ['purchase_type', 'item_id', 'mock'] as const,
      registers: [register],
    })
  : null;

const purchaseRevenueCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_purchase_revenue_stars_total',
      help: 'Total Stars revenue captured through purchases',
      labelNames: ['purchase_type', 'item_id', 'mock'] as const,
      registers: [register],
    })
  : null;

const boostClaimCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_boost_claims_total',
      help: 'Count of boost claim attempts grouped by outcome',
      labelNames: ['boost_type', 'outcome'] as const,
      registers: [register],
    })
  : null;

export function recordUserLoginMetric(isNewUser: boolean, replayStatus: ReplayStatus) {
  loginCounter?.inc({
    is_new_user: isNewUser ? 'true' : 'false',
    replay_status: replayStatus,
  });
}

export function recordSessionRotationMetric(reason: string) {
  sessionRotationCounter?.inc({ reason });
}

export function recordPurchaseInvoiceMetric(
  purchaseType: string,
  status: 'created' | 'reused'
) {
  purchaseInvoiceCounter?.inc({
    purchase_type: purchaseType,
    status,
  });
}

export function recordPurchaseConflictMetric(reason: string) {
  purchaseConflictCounter?.inc({ reason });
}

export function recordPurchaseCompletedMetric(options: {
  purchaseType: string;
  itemId: string;
  priceStars: number;
  mock: boolean;
}) {
  const labels = {
    purchase_type: options.purchaseType,
    item_id: options.itemId,
    mock: options.mock ? 'true' : 'false',
  } as const;
  purchaseCompletedCounter?.inc(labels);
  if (options.priceStars > 0) {
    purchaseRevenueCounter?.inc(labels, options.priceStars);
  }
}

export function recordBoostClaimMetric(params: {
  boostType: string;
  outcome: 'success' | 'already_active' | 'cooldown' | 'requires_premium' | 'error';
}) {
  boostClaimCounter?.inc({
    boost_type: params.boostType,
    outcome: params.outcome,
  });
}
