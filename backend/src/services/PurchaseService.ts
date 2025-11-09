import { transaction } from '../db/connection';
import type { PoolClient } from 'pg';
import { AppError } from '../middleware/errorHandler';
import { logEvent } from '../repositories/EventRepository';
import {
  createPurchase,
  findByPurchaseId,
  PurchaseRecord,
  updatePurchaseStatus,
} from '../repositories/PurchaseRepository';
import { config } from '../config';
import { logger } from '../utils/logger';
import { adjustStarsBalance } from '../repositories/ProgressRepository';
import { contentService } from './ContentService';
import {
  recordPurchaseCompletedMetric,
  recordPurchaseConflictMetric,
  recordPurchaseInvoiceMetric,
  recordPurchaseFailureMetric,
  recordStarsCreditMetric,
  recordUserLifetimeValueMetric,
  recordConversionEventMetric,
} from '../metrics/business';
import { referralRevenueService } from './ReferralRevenueService';

interface RecordPurchaseInput {
  purchaseId: string;
  itemId: string;
  priceStars: number;
  purchaseType: 'stars_pack' | 'cosmetic' | 'boost' | 'unknown';
  metadata?: Record<string, unknown>;
}

// Helper function to determine user segment based on purchase amount
function getUserSegment(priceStars: number): 'whale' | 'dolphin' | 'minnow' | 'free' {
  if (priceStars >= 500) {
    return 'whale'; // High value purchases
  }
  if (priceStars >= 100) {
    return 'dolphin'; // Medium value purchases
  }
  if (priceStars > 0) {
    return 'minnow'; // Small purchases
  }
  return 'free'; // No purchase
}

export class PurchaseService {
  async createInvoice(userId: string, input: RecordPurchaseInput) {
    if (!config.testing.mockPayments && !config.monetization.starsEnabled) {
      recordPurchaseConflictMetric('stars_disabled');
      throw new AppError(403, 'stars_disabled');
    }

    return transaction(async client => {
      const existing = await findByPurchaseId(input.purchaseId, client);
      if (existing) {
        if (existing.userId !== userId) {
          logger.warn(
            {
              userId,
              existing_user_id: existing.userId,
              purchase_id: existing.purchaseId,
            },
            'purchase_invoice_user_mismatch'
          );
          recordPurchaseConflictMetric('invoice_user_mismatch');
          throw new AppError(409, 'purchase_conflict');
        }

        logger.info(
          {
            userId,
            purchase_id: existing.purchaseId,
            status: existing.status,
          },
          'purchase_invoice_reused'
        );
        recordPurchaseInvoiceMetric(existing.purchaseType ?? input.purchaseType, 'reused');
        return existing;
      }

      const pending = await createPurchase(
        input.purchaseId,
        userId,
        input.purchaseType,
        input.itemId,
        input.priceStars,
        'pending',
        { client }
      );

      recordPurchaseInvoiceMetric(input.purchaseType, 'created');

      logger.info(
        {
          userId,
          purchase_id: pending.purchaseId,
          item_id: pending.itemId,
          price_stars: pending.priceStars,
          purchase_type: pending.purchaseType,
        },
        'purchase_invoice_created'
      );

      await logEvent(
        userId,
        'purchase_invoice_created',
        {
          purchase_id: pending.purchaseId,
          item_id: pending.itemId,
          price_stars: pending.priceStars,
          purchase_type: pending.purchaseType,
        },
        { client }
      );

      return pending;
    });
  }

  async recordMockPurchase(userId: string, input: RecordPurchaseInput): Promise<PurchaseRecord> {
    if (!config.testing.mockPayments && !config.monetization.starsEnabled) {
      recordPurchaseConflictMetric('stars_disabled');
      throw new AppError(403, 'stars_disabled');
    }

    return transaction(async client => {
      const existing = await findByPurchaseId(input.purchaseId, client);
      if (existing) {
        if (existing.userId !== userId) {
          logger.warn(
            {
              userId,
              existing_user_id: existing.userId,
              purchase_id: existing.purchaseId,
            },
            'purchase_user_mismatch'
          );
          recordPurchaseConflictMetric('invoice_user_mismatch');
          throw new AppError(409, 'purchase_conflict');
        }

        if (existing.status === 'succeeded') {
          logger.info(
            {
              userId,
              purchase_id: existing.purchaseId,
              item_id: existing.itemId,
              purchase_type: existing.purchaseType,
            },
            'purchase_succeeded_idempotent'
          );
          return existing;
        }

        const updated = await updatePurchaseStatus(input.purchaseId, 'succeeded', client);

        const payload = {
          purchase_id: updated.purchaseId,
          item_id: updated.itemId,
          purchase_type: updated.purchaseType,
          price_stars: updated.priceStars,
          previous_status: existing.status,
          mock: config.testing.mockPayments,
          metadata: input.metadata ?? {},
        };

        logger.info({ userId, ...payload }, 'purchase_succeeded');

        await logEvent(userId, 'purchase_succeeded', payload, { client });

        await this.applyPostPurchaseEffects(userId, input, client);

        const priceStars = typeof updated.priceStars === 'number' ? updated.priceStars : input.priceStars;
        recordPurchaseCompletedMetric({
          purchaseType: updated.purchaseType ?? input.purchaseType ?? 'unknown',
          itemId: updated.itemId ?? input.itemId ?? 'unknown',
          priceStars,
          mock: config.testing.mockPayments,
        });

        // Record LTV metric for ARPU calculation
        if (priceStars > 0) {
          const userSegment = getUserSegment(priceStars);
          recordUserLifetimeValueMetric({ userSegment, starsAmount: priceStars });
        }

        // Record first purchase conversion event
        recordConversionEventMetric({
          eventType: 'first_purchase',
          cohortDay: new Date().toISOString().split('T')[0],
        });

        return updated;
      }

      const purchase = await createPurchase(
        input.purchaseId,
        userId,
        input.purchaseType,
        input.itemId,
        input.priceStars,
        'succeeded',
        { client }
      );

      recordPurchaseInvoiceMetric(input.purchaseType, 'created');

      const payload = {
        purchase_id: purchase.purchaseId,
        item_id: purchase.itemId,
        purchase_type: purchase.purchaseType,
        price_stars: purchase.priceStars,
        previous_status: null,
        mock: config.testing.mockPayments,
        metadata: input.metadata ?? {},
      };

      logger.info({ userId, ...payload }, 'purchase_succeeded');

      await logEvent(userId, 'purchase_succeeded', payload, { client });

      await this.applyPostPurchaseEffects(userId, input, client);

      const priceStars = typeof purchase.priceStars === 'number' ? purchase.priceStars : input.priceStars;
      recordPurchaseCompletedMetric({
        purchaseType: purchase.purchaseType ?? input.purchaseType ?? 'unknown',
        itemId: purchase.itemId ?? input.itemId ?? 'unknown',
        priceStars,
        mock: config.testing.mockPayments,
      });

      // Record LTV metric for ARPU calculation
      if (priceStars > 0) {
        const userSegment = getUserSegment(priceStars);
        recordUserLifetimeValueMetric({ userSegment, starsAmount: priceStars });
      }

      // Record first purchase conversion event
      recordConversionEventMetric({
        eventType: 'first_purchase',
        cohortDay: new Date().toISOString().split('T')[0],
      });

      return purchase;
    });
  }

  private resolveStarPackCredit(input: RecordPurchaseInput): {
    baseStars: number;
    bonusStars: number;
    totalStars: number;
  } {
    const metadata = (input.metadata ?? {}) as {
      stars?: unknown;
      bonus_stars?: unknown;
    };
    const metadataBase = typeof metadata.stars === 'number' ? metadata.stars : undefined;
    const metadataBonus =
      typeof metadata.bonus_stars === 'number' ? metadata.bonus_stars : undefined;

    const pack = contentService.getStarPacks().find(item => item.id === input.itemId);
    const baseStars =
      metadataBase ??
      (typeof pack?.stars === 'number' ? pack.stars : undefined) ??
      (typeof input.priceStars === 'number' ? input.priceStars : 0);
    const bonusStars =
      metadataBonus ?? (typeof pack?.bonus_stars === 'number' ? pack.bonus_stars : 0);
    const derivedTotal = baseStars + bonusStars;
    const totalStars =
      derivedTotal > 0 ? derivedTotal : typeof input.priceStars === 'number' ? input.priceStars : 0;

    return {
      baseStars,
      bonusStars,
      totalStars,
    };
  }

  private async applyPostPurchaseEffects(
    userId: string,
    input: RecordPurchaseInput,
    client: PoolClient
  ): Promise<void> {
    if (input.purchaseType !== 'stars_pack') {
      return;
    }

    const { baseStars, bonusStars, totalStars } = this.resolveStarPackCredit(input);

    if (!totalStars || totalStars <= 0) {
      logger.warn(
        {
          userId,
          purchase_id: input.purchaseId,
          item_id: input.itemId,
          price_stars: input.priceStars,
        },
        'stars_pack_credit_skip'
      );
      return;
    }

    const balanceAfter = await adjustStarsBalance(userId, totalStars, client);

    await logEvent(
      userId,
      'stars_balance_credit',
      {
        source: 'purchase',
        purchase_id: input.purchaseId,
        item_id: input.itemId,
        base_stars: baseStars,
        bonus_stars: bonusStars,
        total_stars: totalStars,
        balance_after: balanceAfter,
      },
      { client }
    );
    recordStarsCreditMetric('purchase', totalStars);

    await referralRevenueService.handlePurchaseReward({
      purchaserId: userId,
      purchaseId: input.purchaseId,
      purchaseType: input.purchaseType,
      creditedStars: totalStars,
      metadata: {
        base_stars: baseStars,
        bonus_stars: bonusStars,
      },
      client,
    });
  }

  async markFailed(purchaseId: string): Promise<PurchaseRecord> {
    return transaction(async client => {
      const existing = await findByPurchaseId(purchaseId, client);

      if (!existing) {
        throw new AppError(404, 'purchase_not_found');
      }

      const updated = await updatePurchaseStatus(purchaseId, 'failed', client);

      const payload = {
        purchase_id: updated.purchaseId,
        item_id: updated.itemId,
        purchase_type: updated.purchaseType,
        price_stars: updated.priceStars,
        previous_status: existing.status,
      };

      logger.warn({ userId: updated.userId, ...payload }, 'purchase_failed');

      await logEvent(updated.userId, 'purchase_failed', payload, { client });
      recordPurchaseFailureMetric(existing.status ?? 'unknown');

      return updated;
    });
  }
}

export const purchaseService = new PurchaseService();
