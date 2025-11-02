import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface ReferralRevenueEventRecord {
  id: string;
  referrerId: string;
  referredId: string;
  referralRelationId: string;
  purchaseId: string;
  purchaseAmount: number;
  shareAmount: number;
  source: string;
  metadata: Record<string, unknown>;
  referredUsername: string | null;
  referredFirstName: string | null;
  grantedAt: Date;
}

export interface ReferralRevenueTotalRecord {
  referralRelationId: string;
  referrerId: string;
  referredId: string;
  totalShareAmount: number;
  totalPurchaseAmount: number;
  lastPurchaseId: string | null;
  lastShareAmount: number | null;
  lastPurchaseAmount: number | null;
  lastPurchaseAt: Date | null;
  updatedAt: Date;
}

interface ReferralRevenueEventRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_relation_id: string;
  purchase_id: string;
  purchase_amount: string | number;
  share_amount: string | number;
  source: string;
  metadata: Record<string, unknown> | null;
  referred_username: string | null;
  referred_first_name: string | null;
  granted_at: string;
}

interface ReferralRevenueTotalRow {
  referral_relation_id: string;
  referrer_id: string;
  referred_id: string;
  total_share_amount: string | number;
  total_purchase_amount: string | number;
  last_purchase_id: string | null;
  last_share_amount: string | number | null;
  last_purchase_amount: string | number | null;
  last_purchase_at: string | null;
  updated_at: string;
}

const toEventRecord = (row: ReferralRevenueEventRow): ReferralRevenueEventRecord => ({
  id: row.id,
  referrerId: row.referrer_id,
  referredId: row.referred_id,
  referralRelationId: row.referral_relation_id,
  purchaseId: row.purchase_id,
  purchaseAmount: typeof row.purchase_amount === 'number' ? row.purchase_amount : Number(row.purchase_amount ?? 0),
  shareAmount: typeof row.share_amount === 'number' ? row.share_amount : Number(row.share_amount ?? 0),
  source: row.source,
  metadata: row.metadata ?? {},
  referredUsername: row.referred_username,
  referredFirstName: row.referred_first_name,
  grantedAt: new Date(row.granted_at),
});

const toTotalRecord = (row: ReferralRevenueTotalRow): ReferralRevenueTotalRecord => ({
  referralRelationId: row.referral_relation_id,
  referrerId: row.referrer_id,
  referredId: row.referred_id,
  totalShareAmount:
    typeof row.total_share_amount === 'number'
      ? row.total_share_amount
      : Number(row.total_share_amount ?? 0),
  totalPurchaseAmount:
    typeof row.total_purchase_amount === 'number'
      ? row.total_purchase_amount
      : Number(row.total_purchase_amount ?? 0),
  lastPurchaseId: row.last_purchase_id,
  lastShareAmount:
    typeof row.last_share_amount === 'number'
      ? row.last_share_amount
      : row.last_share_amount !== null
        ? Number(row.last_share_amount)
        : null,
  lastPurchaseAmount:
    typeof row.last_purchase_amount === 'number'
      ? row.last_purchase_amount
      : row.last_purchase_amount !== null
        ? Number(row.last_purchase_amount)
        : null,
  lastPurchaseAt: row.last_purchase_at ? new Date(row.last_purchase_at) : null,
  updatedAt: new Date(row.updated_at),
});

export async function insertReferralRevenueEvent(
  data: {
    referrerId: string;
    referredId: string;
    referralRelationId: string;
    purchaseId: string;
    purchaseAmount: number;
    shareAmount: number;
    source: string;
    metadata?: Record<string, unknown>;
    referredUsername?: string | null;
    referredFirstName?: string | null;
  },
  client?: PoolClient
): Promise<ReferralRevenueEventRecord> {
  const result = await runQuery<ReferralRevenueEventRow>(
    `INSERT INTO referral_revenue_events (
        referrer_id,
        referred_id,
        referral_relation_id,
        purchase_id,
        purchase_amount,
        share_amount,
        source,
        metadata,
        referred_username,
        referred_first_name
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
     RETURNING *`,
    [
      data.referrerId,
      data.referredId,
      data.referralRelationId,
      data.purchaseId,
      data.purchaseAmount,
      data.shareAmount,
      data.source,
      JSON.stringify(data.metadata ?? {}),
      data.referredUsername ?? null,
      data.referredFirstName ?? null,
    ],
    client
  );

  return toEventRecord(result.rows[0]);
}

export async function upsertReferralRevenueTotal(
  data: {
    referralRelationId: string;
    referrerId: string;
    referredId: string;
    shareDelta: number;
    purchaseId: string;
    purchaseAmount: number;
    purchaseAt: Date;
  },
  client?: PoolClient
): Promise<ReferralRevenueTotalRecord> {
  const result = await runQuery<ReferralRevenueTotalRow>(
    `INSERT INTO referral_revenue_totals (
        referral_relation_id,
        referrer_id,
        referred_id,
        total_share_amount,
        total_purchase_amount,
        last_purchase_id,
        last_share_amount,
        last_purchase_amount,
        last_purchase_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (referral_relation_id) DO UPDATE
       SET total_share_amount = referral_revenue_totals.total_share_amount + EXCLUDED.last_share_amount,
           total_purchase_amount = referral_revenue_totals.total_purchase_amount + EXCLUDED.last_purchase_amount,
           last_purchase_id = EXCLUDED.last_purchase_id,
           last_share_amount = EXCLUDED.last_share_amount,
           last_purchase_amount = EXCLUDED.last_purchase_amount,
           last_purchase_at = EXCLUDED.last_purchase_at,
           updated_at = NOW()
     RETURNING *`,
    [
      data.referralRelationId,
      data.referrerId,
      data.referredId,
      data.shareDelta,
      data.purchaseAmount,
      data.purchaseId,
      data.shareDelta,
      data.purchaseAmount,
      data.purchaseAt.toISOString(),
    ],
    client
  );

  return toTotalRecord(result.rows[0]);
}

export async function sumReferralRevenueSince(
  referrerId: string,
  since: Date,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ total: string | number | null }>(
    `SELECT COALESCE(SUM(share_amount), 0) AS total
     FROM referral_revenue_events
     WHERE referrer_id = $1
       AND granted_at >= $2`,
    [referrerId, since.toISOString()],
    client
  );

  const value = result.rows[0]?.total;
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return 0;
}

export async function sumReferralRevenueAllTime(
  referrerId: string,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ total: string | number | null }>(
    `SELECT COALESCE(SUM(share_amount), 0) AS total
     FROM referral_revenue_events
     WHERE referrer_id = $1`,
    [referrerId],
    client
  );
  const value = result.rows[0]?.total;
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return Number(value);
  }
  return 0;
}

export async function listReferralRevenueEvents(
  referrerId: string,
  options: { limit?: number; offset?: number } = {},
  client?: PoolClient
): Promise<ReferralRevenueEventRecord[]> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);

  const result = await runQuery<ReferralRevenueEventRow>(
    `SELECT *
     FROM referral_revenue_events
     WHERE referrer_id = $1
     ORDER BY granted_at DESC
     LIMIT $2 OFFSET $3`,
    [referrerId, limit, offset],
    client
  );

  return result.rows.map(toEventRecord);
}

export async function listReferralRevenueTotals(
  referrerId: string,
  client?: PoolClient
): Promise<ReferralRevenueTotalRecord[]> {
  const result = await runQuery<ReferralRevenueTotalRow>(
    `SELECT *
     FROM referral_revenue_totals
     WHERE referrer_id = $1
     ORDER BY total_share_amount DESC`,
    [referrerId],
    client
  );

  return result.rows.map(toTotalRecord);
}
