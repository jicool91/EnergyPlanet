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

const purchaseFailureCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_purchase_failures_total',
      help: 'Count of failed purchases grouped by reason',
      labelNames: ['reason'] as const,
      registers: [register],
    })
  : null;

const starsCreditCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_stars_credit_total',
      help: 'Stars credited to users grouped by source',
      labelNames: ['source'] as const,
      registers: [register],
    })
  : null;

const referralRevenueCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_referral_revenue_stars_total',
      help: 'Stars credited to referrers from invitee purchases',
      labelNames: ['source'] as const,
      registers: [register],
    })
  : null;

// === NEW: Dashboard Overview Metrics ===

const activeUsersGauge = metricsEnabled
  ? new client.Gauge({
      name: 'energyplanet_active_users_current',
      help: 'Current number of active concurrent users',
      registers: [register],
    })
  : null;

const dailyActiveUsersGauge = metricsEnabled
  ? new client.Gauge({
      name: 'energyplanet_daily_active_users',
      help: 'Number of unique users active in the last 24 hours',
      registers: [register],
    })
  : null;

const sessionDurationHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_session_duration_seconds',
      help: 'Duration of user sessions in seconds',
      buckets: [30, 60, 120, 300, 600, 1200, 1800, 3600, 7200],
      registers: [register],
    })
  : null;

const conversionEventCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_conversion_events_total',
      help: 'Conversion funnel events (signup, first_tap, first_purchase, etc)',
      labelNames: ['event_type', 'cohort_day'] as const,
      registers: [register],
    })
  : null;

const userLifetimeValueCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_user_lifetime_value_stars_total',
      help: 'Cumulative Stars spent by each user (for ARPU calculation)',
      labelNames: ['user_segment'] as const,
      registers: [register],
    })
  : null;

const paymentProviderStatusCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_payment_provider_status_total',
      help: 'Provider status callbacks grouped by provider and status',
      labelNames: ['provider', 'status'] as const,
      registers: [register],
    })
  : null;

const purchaseDurationHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_purchase_duration_seconds',
      help: 'Time between purchase creation and completion',
      buckets: [5, 15, 30, 60, 120, 300, 600, 1200],
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

export function recordPurchaseFailureMetric(reason: string) {
  if (!metricsEnabled) {
    return;
  }
  purchaseFailureCounter?.inc({ reason });
}

export function recordStarsCreditMetric(source: string, amount: number) {
  if (!metricsEnabled || amount <= 0) {
    return;
  }
  starsCreditCounter?.inc({ source }, amount);
}

export function recordReferralRevenueMetric(source: string, amount: number) {
  if (!metricsEnabled || amount <= 0) {
    return;
  }
  referralRevenueCounter?.inc({ source }, amount);
}

// === NEW: Dashboard Overview Metric Functions ===

export function setActiveUsersMetric(count: number) {
  if (!metricsEnabled || count < 0) {
    return;
  }
  activeUsersGauge?.set(count);
}

export function setDailyActiveUsersMetric(count: number) {
  if (!metricsEnabled || count < 0) {
    return;
  }
  dailyActiveUsersGauge?.set(count);
}

export function recordSessionDurationMetric(durationSeconds: number) {
  if (!metricsEnabled || durationSeconds < 0) {
    return;
  }
  sessionDurationHistogram?.observe(durationSeconds);
}

export function recordConversionEventMetric(params: {
  eventType: 'signup' | 'first_tap' | 'first_purchase' | 'first_building' | 'day1_return' | 'day7_return';
  cohortDay?: string;
}) {
  if (!metricsEnabled) {
    return;
  }
  conversionEventCounter?.inc({
    event_type: params.eventType,
    cohort_day: params.cohortDay || 'unknown',
  });
}

export function recordUserLifetimeValueMetric(params: {
  userSegment: 'whale' | 'dolphin' | 'minnow' | 'free';
  starsAmount: number;
}) {
  if (!metricsEnabled || params.starsAmount <= 0) {
    return;
  }
  userLifetimeValueCounter?.inc(
    { user_segment: params.userSegment },
    params.starsAmount
  );
}

export function recordPaymentProviderStatusMetric(provider: string, status: string) {
  if (!metricsEnabled) {
    return;
  }
  paymentProviderStatusCounter?.inc({
    provider,
    status,
  });
}

export function recordPurchaseDurationMetric(seconds: number) {
  if (!metricsEnabled || seconds <= 0) {
    return;
  }
  purchaseDurationHistogram?.observe(seconds);
}
