import { PoolClient } from 'pg';
import { contentService, ReferralRevenueShareConfig } from './ContentService';
import { getReferralRelationByReferred } from '../repositories/ReferralRepository';
import {
  insertReferralRevenueEvent,
  listReferralRevenueEvents,
  listReferralRevenueTotals,
  ReferralRevenueEventRecord,
  ReferralRevenueTotalRecord,
  sumReferralRevenueAllTime,
  sumReferralRevenueSince,
  upsertReferralRevenueTotal,
} from '../repositories/ReferralRevenueRepository';
import { adjustStarsBalance } from '../repositories/ProgressRepository';
import { logEvent } from '../repositories/EventRepository';
import { findById as findUserById } from '../repositories/UserRepository';
import { invalidateProfileCache } from '../cache/invalidation';
import { recordReferralRevenueMetric, recordStarsCreditMetric } from '../metrics/business';
import { runQuery } from '../repositories/base';

interface PurchaseRewardInput {
  purchaserId: string;
  purchaseId: string;
  purchaseType: string;
  creditedStars: number;
  metadata?: Record<string, unknown>;
  client: PoolClient;
}

export interface ReferralRevenueEventView {
  id: string;
  shareAmount: number;
  purchaseAmount: number;
  purchaseId: string;
  purchaseType: string;
  referred: {
    userId: string;
    username: string | null;
    firstName: string | null;
  };
  grantedAt: string;
}

export interface ReferralRevenueFriendView {
  referred: {
    userId: string;
    username: string | null;
    firstName: string | null;
  };
  totalShare: number;
  totalPurchase: number;
  lastShare?: number | null;
  lastPurchase?: number | null;
  lastPurchaseAt?: string | null;
}

export interface ReferralRevenueOverview {
  revenueShare: {
    percentage: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  totals: {
    allTime: number;
    month: number;
    today: number;
  };
  recent: ReferralRevenueEventView[];
  friends: ReferralRevenueFriendView[];
  updatedAt: string;
}

export interface ReferralRevenueTotalsView {
  revenueShare: {
    percentage: number;
    dailyCap?: number;
    monthlyCap?: number;
  } | null;
  totals: {
    allTime: number;
    month: number;
    today: number;
  };
  updatedAt: string;
}

const SOURCE_REFERRAL_REVENUE = 'referral_revenue';

class ReferralRevenueService {
  private getShareConfig(): ReferralRevenueShareConfig | null {
    const config = contentService.getReferralConfig();
    if (!config || !config.revenueShare || config.revenueShare.percentage <= 0) {
      return null;
    }
    return config.revenueShare;
  }

  private getStartOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private getStartOfUtcMonth(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  async handlePurchaseReward(input: PurchaseRewardInput): Promise<void> {
    const shareConfig = this.getShareConfig();
    if (!shareConfig || input.creditedStars <= 0) {
      return;
    }

    const relation = await getReferralRelationByReferred(input.purchaserId, input.client);
    if (!relation) {
      return;
    }

    const rawShare = Math.floor(input.creditedStars * shareConfig.percentage);
    if (rawShare <= 0) {
      return;
    }

    const now = new Date();
    let shareToGrant = rawShare;

    if (shareConfig.dailyCap && shareConfig.dailyCap > 0) {
      const startOfDay = this.getStartOfUtcDay(now);
      const grantedToday = await sumReferralRevenueSince(relation.referrerId, startOfDay, input.client);
      const remaining = Math.max(0, shareConfig.dailyCap - grantedToday);
      shareToGrant = Math.min(shareToGrant, remaining);
    }

    if (shareToGrant <= 0) {
      return;
    }

    if (shareConfig.monthlyCap && shareConfig.monthlyCap > 0) {
      const startOfMonth = this.getStartOfUtcMonth(now);
      const grantedThisMonth = await sumReferralRevenueSince(
        relation.referrerId,
        startOfMonth,
        input.client
      );
      const remaining = Math.max(0, shareConfig.monthlyCap - grantedThisMonth);
      shareToGrant = Math.min(shareToGrant, remaining);
    }

    if (shareToGrant <= 0) {
      return;
    }

    const referredUser = await findUserById(input.purchaserId, input.client);

    const balanceAfter = await adjustStarsBalance(relation.referrerId, shareToGrant, input.client);
    recordStarsCreditMetric(SOURCE_REFERRAL_REVENUE, shareToGrant);
    recordReferralRevenueMetric(input.purchaseType, shareToGrant);

    const metadata = {
      purchase_type: input.purchaseType,
      credited_stars: input.creditedStars,
      raw_share: rawShare,
      applied_share: shareToGrant,
      config_percentage: shareConfig.percentage,
      ...input.metadata,
    };

    const eventRecord = await insertReferralRevenueEvent(
      {
        referrerId: relation.referrerId,
        referredId: input.purchaserId,
        referralRelationId: relation.id,
        purchaseId: input.purchaseId,
        purchaseAmount: input.creditedStars,
        shareAmount: shareToGrant,
        source: input.purchaseType,
        metadata,
        referredUsername: referredUser?.username ?? null,
        referredFirstName: referredUser?.firstName ?? null,
      },
      input.client
    );

    await upsertReferralRevenueTotal(
      {
        referralRelationId: relation.id,
        referrerId: relation.referrerId,
        referredId: input.purchaserId,
        shareDelta: shareToGrant,
        purchaseId: input.purchaseId,
        purchaseAmount: input.creditedStars,
        purchaseAt: eventRecord.grantedAt,
      },
      input.client
    );

    await logEvent(
      relation.referrerId,
      'referral_revenue_granted',
      {
        referred_id: input.purchaserId,
        purchase_id: input.purchaseId,
        share_amount: shareToGrant,
        purchase_amount: input.creditedStars,
        balance_after: balanceAfter,
      },
      { client: input.client }
    );

    await logEvent(
      input.purchaserId,
      'referral_revenue_generated',
      {
        referrer_id: relation.referrerId,
        purchase_id: input.purchaseId,
        share_amount: shareToGrant,
        purchase_amount: input.creditedStars,
      },
      { client: input.client }
    );

    await invalidateProfileCache(relation.referrerId);
  }

  private async enrichTotalsWithUsers(
    totals: ReferralRevenueTotalRecord[],
    client?: PoolClient
  ): Promise<ReferralRevenueFriendView[]> {
    if (totals.length === 0) {
      return [];
    }

    const ids = totals.map(item => item.referredId);
    const result = await inputQueryUsers(ids, client);
    return totals.map(total => {
      const user = result.get(total.referredId) ?? null;
      return {
        referred: {
          userId: total.referredId,
          username: user?.username ?? null,
          firstName: user?.firstName ?? null,
        },
        totalShare: total.totalShareAmount,
        totalPurchase: total.totalPurchaseAmount,
        lastShare: total.lastShareAmount,
        lastPurchase: total.lastPurchaseAmount,
        lastPurchaseAt: total.lastPurchaseAt ? total.lastPurchaseAt.toISOString() : null,
      };
    });
  }

  private async enrichEventsWithUsers(
    events: ReferralRevenueEventRecord[],
    client?: PoolClient
  ): Promise<ReferralRevenueEventView[]> {
    if (events.length === 0) {
      return [];
    }

    const ids = Array.from(new Set(events.map(event => event.referredId)));
    const userMap = await inputQueryUsers(ids, client);

    return events.map(event => {
      const user = userMap.get(event.referredId);
      return {
        id: event.id,
        shareAmount: event.shareAmount,
        purchaseAmount: event.purchaseAmount,
        purchaseId: event.purchaseId,
        purchaseType: event.source,
        referred: {
          userId: event.referredId,
          username: user?.username ?? event.referredUsername ?? null,
          firstName: user?.firstName ?? event.referredFirstName ?? null,
        },
        grantedAt: event.grantedAt.toISOString(),
      };
    });
  }

  async getOverview(referrerId: string, client?: PoolClient): Promise<ReferralRevenueOverview> {
    const baseTotals = await this.getTotals(referrerId, client);
    const totals = await listReferralRevenueTotals(referrerId, client);
    const events = await listReferralRevenueEvents(referrerId, { limit: 20 }, client);

    const friends = await this.enrichTotalsWithUsers(totals, client);
    const recent = await this.enrichEventsWithUsers(events, client);

    return {
      revenueShare: baseTotals.revenueShare,
      totals: baseTotals.totals,
      friends,
      recent,
      updatedAt: baseTotals.updatedAt,
    };
  }

  async getTotals(referrerId: string, client?: PoolClient): Promise<ReferralRevenueTotalsView> {
    const shareConfig = this.getShareConfig();
    const now = new Date();
    const startOfDay = this.getStartOfUtcDay(now);
    const startOfMonth = this.getStartOfUtcMonth(now);

    const [allTime, month, today] = await Promise.all([
      sumReferralRevenueAllTime(referrerId, client),
      sumReferralRevenueSince(referrerId, startOfMonth, client),
      sumReferralRevenueSince(referrerId, startOfDay, client),
    ]);

    return {
      revenueShare: shareConfig
        ? {
            percentage: shareConfig.percentage,
            dailyCap: shareConfig.dailyCap,
            monthlyCap: shareConfig.monthlyCap,
          }
        : null,
      totals: {
        allTime,
        month,
        today,
      },
      updatedAt: now.toISOString(),
    };
  }
}

async function inputQueryUsers(ids: string[], client?: PoolClient) {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) {
    return new Map<string, { username: string | null; firstName: string | null }>();
  }

  const placeholders = unique.map((_, index) => `$${index + 1}`).join(',');
  const result = await runQuery<{
    id: string;
    username: string | null;
    first_name: string | null;
  }>(
    `SELECT id, username, first_name
     FROM users
     WHERE id IN (${placeholders})`,
    unique,
    client
  );

  const map = new Map<string, { username: string | null; firstName: string | null }>();
  for (const row of result.rows) {
    map.set(row.id, {
      username: row.username,
      firstName: row.first_name,
    });
  }
  return map;
}

export const referralRevenueService = new ReferralRevenueService();
