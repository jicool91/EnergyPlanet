import { transaction } from '../db/connection';
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

interface RecordPurchaseInput {
  purchaseId: string;
  itemId: string;
  priceStars: number;
  purchaseType: 'stars_pack' | 'cosmetic' | 'boost' | 'unknown';
  metadata?: Record<string, unknown>;
}

export class PurchaseService {
  async createInvoice(userId: string, input: RecordPurchaseInput) {
    if (!config.testing.mockPayments && !config.monetization.starsEnabled) {
      throw new AppError(403, 'stars_disabled');
    }

    return transaction(async client => {
      const existing = await findByPurchaseId(input.purchaseId, client);
      if (existing) {
        if (existing.userId !== userId) {
          logger.warn('purchase_invoice_user_mismatch', {
            userId,
            existing_user_id: existing.userId,
            purchase_id: existing.purchaseId,
          });
          throw new AppError(409, 'purchase_conflict');
        }

        logger.info('purchase_invoice_reused', {
          userId,
          purchase_id: existing.purchaseId,
          status: existing.status,
        });
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

      logger.info('purchase_invoice_created', {
        userId,
        purchase_id: pending.purchaseId,
        item_id: pending.itemId,
        price_stars: pending.priceStars,
        purchase_type: pending.purchaseType,
      });

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
      throw new AppError(403, 'stars_disabled');
    }

    return transaction(async client => {
      const existing = await findByPurchaseId(input.purchaseId, client);
      if (existing) {
        if (existing.userId !== userId) {
          logger.warn('purchase_user_mismatch', {
            userId,
            existing_user_id: existing.userId,
            purchase_id: existing.purchaseId,
          });
          throw new AppError(409, 'purchase_conflict');
        }

        if (existing.status === 'succeeded') {
          logger.info('purchase_succeeded_idempotent', {
            userId,
            purchase_id: existing.purchaseId,
            item_id: existing.itemId,
            purchase_type: existing.purchaseType,
          });
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

        logger.info('purchase_succeeded', { userId, ...payload });

        await logEvent(userId, 'purchase_succeeded', payload, { client });

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

      const payload = {
        purchase_id: purchase.purchaseId,
        item_id: purchase.itemId,
        purchase_type: purchase.purchaseType,
        price_stars: purchase.priceStars,
        previous_status: null,
        mock: config.testing.mockPayments,
        metadata: input.metadata ?? {},
      };

      logger.info('purchase_succeeded', { userId, ...payload });

      await logEvent(userId, 'purchase_succeeded', payload, { client });

      return purchase;
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

      logger.warn('purchase_failed', { userId: updated.userId, ...payload });

      await logEvent(updated.userId, 'purchase_failed', payload, { client });

      return updated;
    });
  }
}

export const purchaseService = new PurchaseService();
