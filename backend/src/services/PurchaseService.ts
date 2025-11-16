import { transaction } from '../db/connection';
import type { PoolClient } from 'pg';
import { AppError } from '../middleware/errorHandler';
import { logEvent } from '../repositories/EventRepository';
import {
  createPurchase,
  findByPurchaseId,
  findByProviderOrderId,
  PurchaseRecord,
  updatePurchase,
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
  recordPaymentProviderStatusMetric,
  recordPurchaseDurationMetric,
} from '../metrics/business';
import { referralRevenueService } from './ReferralRevenueService';
import { insertPurchaseEvent } from '../repositories/PurchaseEventRepository';
import { getPaymentProvider } from './payments';
import type { ProviderStatus, ProviderStatusUpdate } from './payments/PaymentProvider';

interface RecordPurchaseInput {
  purchaseId: string;
  itemId: string;
  priceStars: number;
  purchaseType: 'stars_pack' | 'cosmetic' | 'boost' | 'unknown';
  metadata?: Record<string, unknown>;
}

interface StartPurchaseInput {
  purchaseId: string;
  itemId: string;
  purchaseType: 'stars_pack' | 'cosmetic' | 'boost' | 'unknown';
  amountMinor: number;
  currency?: string;
  provider?: string;
  priceStars?: number;
  metadata?: Record<string, unknown>;
  description?: string;
}

interface StartPurchaseResult {
  purchase: PurchaseRecord;
  providerPayload: {
    payment_url?: string | null;
    qr_payload?: string | null;
    expires_at?: string | null;
  };
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

  async startPurchase(userId: string, input: StartPurchaseInput): Promise<StartPurchaseResult> {
    const amountMinor = Math.max(0, input.amountMinor);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      throw new AppError(400, 'invalid_amount');
    }

    const provider = getPaymentProvider(input.provider);
    const currency = input.currency ?? config.payment.defaultCurrency ?? 'RUB';

    const charge = await provider.createCharge({
      purchaseId: input.purchaseId,
      userId,
      itemId: input.itemId,
      description: input.description,
      amountMinor,
      currency,
      metadata: input.metadata,
    });

    const providerOrderId = charge.providerOrderId || input.purchaseId;
    const expiresAt =
      charge.expiresAt ?? new Date(Date.now() + config.payment.qrTtlMinutes * 60 * 1000);
    const mergedMetadata = { ...(input.metadata ?? {}), ...(charge.metadata ?? {}) };
    const initialStatus = charge.status === 'paid' ? 'succeeded' : 'pending';

    const providerPayload = {
      payment_url: charge.paymentUrl ?? null,
      qr_payload: charge.qrPayload ?? null,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    };

    const purchase = await transaction(async client => {
      const existing = await findByPurchaseId(input.purchaseId, client);
      if (existing) {
        if (existing.userId !== userId) {
          throw new AppError(409, 'purchase_conflict');
        }
        return existing;
      }

      const created = await createPurchase(
        input.purchaseId,
        userId,
        input.purchaseType,
        input.itemId,
        input.priceStars ?? null,
        initialStatus,
        {
          provider: provider.name,
          currency,
          amountMinor,
          providerOrderId,
          paymentUrl: providerPayload.payment_url,
          sbpPayload: providerPayload.qr_payload,
          expiresAt,
          metadata: mergedMetadata,
          client,
        }
      );

      recordPurchaseInvoiceMetric(input.purchaseType, 'created');

      await logEvent(
        userId,
        'purchase_created',
        {
          purchase_id: created.purchaseId,
          item_id: created.itemId,
          amount_minor: amountMinor,
          currency,
          provider: provider.name,
        },
        { client }
      );

      await insertPurchaseEvent(
        {
          purchaseId: created.purchaseId,
          provider: provider.name,
          providerStatus: initialStatus,
          payload: mergedMetadata,
        },
        client
      );
      recordPaymentProviderStatusMetric(provider.name, initialStatus);

      if (initialStatus === 'succeeded') {
        await this.handlePurchaseSuccess(userId, created, mergedMetadata, null, client, {
          mock: provider.name === 'mock',
        });
      }

      return created;
    });

    return {
      purchase,
      providerPayload: purchase.provider === provider.name ? providerPayload : {
        payment_url: purchase.paymentUrl,
        qr_payload: purchase.sbpPayload,
        expires_at: purchase.expiresAt ? purchase.expiresAt.toISOString() : null,
      },
    };
  }

  async getPurchaseStatus(userId: string, purchaseId: string) {
    const purchase = await findByPurchaseId(purchaseId);
    if (!purchase || purchase.userId !== userId) {
      throw new AppError(404, 'purchase_not_found');
    }

    return {
      purchase_id: purchase.purchaseId,
      status: purchase.status,
      status_reason: purchase.statusReason,
      payment_url: purchase.paymentUrl,
      qr_payload: purchase.sbpPayload,
      expires_at: purchase.expiresAt ? purchase.expiresAt.toISOString() : null,
    };
  }

  async cancelPurchase(userId: string, purchaseId: string): Promise<PurchaseRecord> {
    return transaction(async client => {
      const purchase = await findByPurchaseId(purchaseId, client);
      if (!purchase || purchase.userId !== userId) {
        throw new AppError(404, 'purchase_not_found');
      }
      if (purchase.status === 'succeeded') {
        throw new AppError(409, 'purchase_already_completed');
      }

      const updated = await updatePurchase(
        purchase.purchaseId,
        {
          status: 'failed',
          statusReason: 'user_cancelled',
        },
        client
      );

      await logEvent(
        userId,
        'purchase_cancelled',
        {
          purchase_id: purchase.purchaseId,
          status: purchase.status,
        },
        { client }
      );

      return updated;
    });
  }

  async handleProviderUpdate(
    providerName: string,
    update: ProviderStatusUpdate
  ): Promise<PurchaseRecord | null> {
    if (!update.providerOrderId) {
      return null;
    }

    return transaction(async client => {
      const purchase = await findByProviderOrderId(providerName, update.providerOrderId, client);
      if (!purchase) {
        return null;
      }

      await insertPurchaseEvent(
        {
          purchaseId: purchase.purchaseId,
          provider: providerName,
          providerStatus: update.status,
          payload: update.payload,
        },
        client
      );
      recordPaymentProviderStatusMetric(providerName, update.status);

      const mergedMetadata = {
        ...(purchase.metadata ?? {}),
        ...(update.payload ?? {}),
      };

      const nextStatus = this.mapProviderStatus(update.status);
      const updated = await updatePurchase(
        purchase.purchaseId,
        {
          status: nextStatus,
          statusReason: update.statusReason ?? null,
          paymentUrl: update.paymentUrl ?? undefined,
          sbpPayload: update.qrPayload ?? undefined,
          expiresAt: update.expiresAt ?? undefined,
          metadata: mergedMetadata,
        },
        client
      );

      if (nextStatus === 'succeeded' && purchase.status !== 'succeeded') {
        await this.handlePurchaseSuccess(
          purchase.userId,
          updated,
          mergedMetadata,
          purchase.status,
          client,
          { mock: providerName === 'mock' }
        );
      }

      return updated;
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

        await this.handlePurchaseSuccess(
          userId,
          updated,
          input.metadata,
          existing.status,
          client,
          { mock: config.testing.mockPayments }
        );
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

      await this.handlePurchaseSuccess(userId, purchase, input.metadata, null, client, {
        mock: config.testing.mockPayments,
      });

      return purchase;
    });
  }

  private mapProviderStatus(status: ProviderStatus): string {
    switch (status) {
      case 'paid':
        return 'succeeded';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  }

  private async handlePurchaseSuccess(
    userId: string,
    purchase: PurchaseRecord,
    metadata: Record<string, unknown> | undefined,
    previousStatus: string | null,
    client: PoolClient,
    options?: { mock?: boolean }
  ): Promise<void> {
    const payload = {
      purchase_id: purchase.purchaseId,
      item_id: purchase.itemId,
      purchase_type: purchase.purchaseType,
      price_stars: purchase.priceStars,
      previous_status: previousStatus,
      mock: options?.mock ?? false,
      metadata: metadata ?? {},
    };

    logger.info({ userId, ...payload }, 'purchase_succeeded');
    await logEvent(userId, 'purchase_succeeded', payload, { client });

    const recordInput: RecordPurchaseInput = {
      purchaseId: purchase.purchaseId,
      itemId: purchase.itemId,
      priceStars: typeof purchase.priceStars === 'number' ? purchase.priceStars : 0,
      purchaseType: (purchase.purchaseType as RecordPurchaseInput['purchaseType']) ?? 'unknown',
      metadata,
    };

    await this.applyPostPurchaseEffects(userId, recordInput, client);

    const priceStars = recordInput.priceStars;
    recordPurchaseCompletedMetric({
      purchaseType: recordInput.purchaseType,
      itemId: purchase.itemId ?? 'unknown',
      priceStars,
      mock: options?.mock ?? false,
    });

    if (priceStars > 0) {
      const userSegment = getUserSegment(priceStars);
      recordUserLifetimeValueMetric({ userSegment, starsAmount: priceStars });
    }

    recordConversionEventMetric({
      eventType: 'first_purchase',
      cohortDay: new Date().toISOString().split('T')[0],
    });

    const durationSeconds = (Date.now() - purchase.createdAt.getTime()) / 1000;
    recordPurchaseDurationMetric(durationSeconds);
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
