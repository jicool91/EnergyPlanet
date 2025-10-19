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
        return existing;
      }

      const purchase = await createPurchase(
        input.purchaseId,
        userId,
        input.purchaseType,
        input.itemId,
        input.priceStars,
        'completed',
        { client }
      );

      await logEvent(
        userId,
        'purchase_complete',
        {
          purchase_id: purchase.purchaseId,
          item_id: purchase.itemId,
          purchase_type: purchase.purchaseType,
          price_stars: purchase.priceStars,
          mock: config.testing.mockPayments,
          metadata: input.metadata ?? {},
        },
        { client }
      );

      return purchase;
    });
  }

  async markFailed(purchaseId: string): Promise<PurchaseRecord> {
    return updatePurchaseStatus(purchaseId, 'failed');
  }
}

export const purchaseService = new PurchaseService();
