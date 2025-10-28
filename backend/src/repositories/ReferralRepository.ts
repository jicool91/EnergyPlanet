import { PoolClient } from 'pg';
import { runQuery } from './base';

interface ReferralCodeRow {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
}

export interface ReferralCodeRecord {
  id: string;
  userId: string;
  code: string;
  createdAt: Date;
}

interface ReferralRelationRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  activated_at: string;
  first_purchase_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ReferralRelationRecord {
  id: string;
  referrerId: string;
  referredId: string;
  status: string;
  activatedAt: Date;
  firstPurchaseAt: Date | null;
  metadata: Record<string, unknown>;
}

interface ReferralRewardRow {
  id: string;
  referrer_id: string;
  milestone_id: string;
  reward_payload: Record<string, unknown> | null;
  granted_at: string;
}

export interface ReferralRewardRecord {
  id: string;
  referrerId: string;
  milestoneId: string;
  rewardPayload: Record<string, unknown>;
  grantedAt: Date;
}

function mapCode(row: ReferralCodeRow): ReferralCodeRecord {
  return {
    id: row.id,
    userId: row.user_id,
    code: row.code,
    createdAt: new Date(row.created_at),
  };
}

function mapRelation(row: ReferralRelationRow): ReferralRelationRecord {
  return {
    id: row.id,
    referrerId: row.referrer_id,
    referredId: row.referred_id,
    status: row.status,
    activatedAt: new Date(row.activated_at),
    firstPurchaseAt: row.first_purchase_at ? new Date(row.first_purchase_at) : null,
    metadata: row.metadata ?? {},
  };
}

function mapReward(row: ReferralRewardRow): ReferralRewardRecord {
  return {
    id: row.id,
    referrerId: row.referrer_id,
    milestoneId: row.milestone_id,
    rewardPayload: row.reward_payload ?? {},
    grantedAt: new Date(row.granted_at),
  };
}

export async function getReferralCodeByUser(
  userId: string,
  client?: PoolClient
): Promise<ReferralCodeRecord | null> {
  const result = await runQuery<ReferralCodeRow>(
    `SELECT *
     FROM referral_codes
     WHERE user_id = $1`,
    [userId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapCode(result.rows[0]);
}

export async function getReferralCodeByCode(
  code: string,
  client?: PoolClient
): Promise<ReferralCodeRecord | null> {
  const result = await runQuery<ReferralCodeRow>(
    `SELECT *
     FROM referral_codes
     WHERE code = $1`,
    [code.toUpperCase()],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapCode(result.rows[0]);
}

export async function createReferralCode(
  userId: string,
  code: string,
  client?: PoolClient
): Promise<ReferralCodeRecord> {
  const result = await runQuery<ReferralCodeRow>(
    `INSERT INTO referral_codes (user_id, code)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE
       SET code = EXCLUDED.code
     RETURNING *`,
    [userId, code.toUpperCase()],
    client
  );

  return mapCode(result.rows[0]);
}

export async function createReferralRelation(
  referrerId: string,
  referredId: string,
  metadata: Record<string, unknown>,
  client?: PoolClient
): Promise<ReferralRelationRecord> {
  const result = await runQuery<ReferralRelationRow>(
    `INSERT INTO referral_relations (
        referrer_id,
        referred_id,
        status,
        metadata
     )
     VALUES ($1, $2, 'activated', $3::jsonb)
     RETURNING *`,
    [referrerId, referredId, JSON.stringify(metadata ?? {})],
    client
  );

  return mapRelation(result.rows[0]);
}

export async function getReferralRelationByReferred(
  referredId: string,
  client?: PoolClient
): Promise<ReferralRelationRecord | null> {
  const result = await runQuery<ReferralRelationRow>(
    `SELECT *
     FROM referral_relations
     WHERE referred_id = $1`,
    [referredId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapRelation(result.rows[0]);
}

export async function listReferralRelations(
  referrerId: string,
  client?: PoolClient
): Promise<ReferralRelationRecord[]> {
  const result = await runQuery<ReferralRelationRow>(
    `SELECT *
     FROM referral_relations
     WHERE referrer_id = $1
     ORDER BY activated_at DESC`,
    [referrerId],
    client
  );

  return result.rows.map(mapRelation);
}

export async function countReferralRelations(
  referrerId: string,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*)::bigint AS count
     FROM referral_relations
     WHERE referrer_id = $1`,
    [referrerId],
    client
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function countReferralRelationsSince(
  referrerId: string,
  since: Date,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*)::bigint AS count
     FROM referral_relations
     WHERE referrer_id = $1
       AND activated_at >= $2`,
    [referrerId, since.toISOString()],
    client
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function listReferralRewards(
  referrerId: string,
  client?: PoolClient
): Promise<ReferralRewardRecord[]> {
  const result = await runQuery<ReferralRewardRow>(
    `SELECT *
     FROM referral_rewards
     WHERE referrer_id = $1
     ORDER BY granted_at DESC`,
    [referrerId],
    client
  );

  return result.rows.map(mapReward);
}

export async function hasReferralReward(
  referrerId: string,
  milestoneId: string,
  client?: PoolClient
): Promise<boolean> {
  const result = await runQuery<{ exists: boolean }>(
    `SELECT EXISTS(
        SELECT 1
        FROM referral_rewards
        WHERE referrer_id = $1
          AND milestone_id = $2
     ) AS exists`,
    [referrerId, milestoneId],
    client
  );

  return Boolean(result.rows[0]?.exists);
}

export async function insertReferralReward(
  referrerId: string,
  milestoneId: string,
  rewardPayload: Record<string, unknown>,
  client?: PoolClient
): Promise<ReferralRewardRecord> {
  const result = await runQuery<ReferralRewardRow>(
    `INSERT INTO referral_rewards (referrer_id, milestone_id, reward_payload)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (referrer_id, milestone_id)
     DO UPDATE SET
       reward_payload = EXCLUDED.reward_payload,
       granted_at = NOW()
     RETURNING *`,
    [referrerId, milestoneId, JSON.stringify(rewardPayload ?? {})],
    client
  );

  return mapReward(result.rows[0]);
}

export async function countReferralRewardsSince(
  referrerId: string,
  since: Date,
  client?: PoolClient
): Promise<number> {
  const result = await runQuery<{ count: string }>(
    `SELECT COUNT(*)::bigint AS count
     FROM referral_rewards
     WHERE referrer_id = $1
       AND granted_at >= $2`,
    [referrerId, since.toISOString()],
    client
  );

  return Number(result.rows[0]?.count ?? 0);
}

export async function insertReferralEvent(
  userId: string,
  eventType: string,
  payload: Record<string, unknown>,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `INSERT INTO referral_events (user_id, event_type, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, eventType, JSON.stringify(payload ?? {})],
    client
  );
}
