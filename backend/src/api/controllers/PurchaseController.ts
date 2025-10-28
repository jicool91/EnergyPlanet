import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { purchaseService } from '../../services/PurchaseService';
import { contentService } from '../../services/ContentService';

type PurchaseType = 'stars_pack' | 'cosmetic' | 'boost' | 'unknown';

const normalizePurchaseType = (value: unknown): PurchaseType => {
  if (value === 'stars_pack' || value === 'cosmetic' || value === 'boost') {
    return value;
  }
  return 'unknown';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

type InvoiceBody = {
  purchase_id?: unknown;
  item_id?: unknown;
  price_stars?: unknown;
  purchase_type?: unknown;
  metadata?: unknown;
};

type InvoiceRequest = AuthRequest & { body: InvoiceBody };

export class PurchaseController {
  invoice = async (req: InvoiceRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const rawBody: unknown = req.body;
      if (!isPlainObject(rawBody)) {
        throw new AppError(400, 'invalid_purchase_payload');
      }

      const purchaseIdRaw = rawBody.purchase_id;
      const itemIdRaw = rawBody.item_id;
      const priceStarsRaw = rawBody.price_stars;
      const purchaseTypeRaw = rawBody.purchase_type;
      const metadataRaw = rawBody.metadata;

      if (typeof purchaseIdRaw !== 'string' || typeof itemIdRaw !== 'string' || typeof priceStarsRaw !== 'number') {
        throw new AppError(400, 'invalid_purchase_payload');
      }

      const invoice = await purchaseService.createInvoice(req.user.id, {
        purchaseId: purchaseIdRaw,
        itemId: itemIdRaw,
        priceStars: priceStarsRaw,
        purchaseType: normalizePurchaseType(purchaseTypeRaw),
        metadata: typeof metadataRaw === 'object' && metadataRaw !== null ? (metadataRaw as Record<string, unknown>) : undefined,
      });

      res.status(200).json({
        success: true,
        invoice: {
          purchase_id: invoice.purchaseId,
          status: invoice.status,
          item_id: invoice.itemId,
          price_stars: invoice.priceStars,
          purchase_type: invoice.purchaseType,
          pay_url: `https://t.me/energy_planet_bot/pay?payload=${encodeURIComponent(invoice.purchaseId)}`,
          created_at: invoice.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: InvoiceRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const rawBody: unknown = req.body;
      if (!isPlainObject(rawBody)) {
        throw new AppError(400, 'invalid_purchase_payload');
      }

      const purchaseIdRaw = rawBody.purchase_id;
      const itemIdRaw = rawBody.item_id;
      const priceStarsRaw = rawBody.price_stars;
      const purchaseTypeRaw = rawBody.purchase_type;
      const metadataRaw = rawBody.metadata;

      if (typeof purchaseIdRaw !== 'string' || typeof itemIdRaw !== 'string' || typeof priceStarsRaw !== 'number') {
        throw new AppError(400, 'invalid_purchase_payload');
      }

      const purchase = await purchaseService.recordMockPurchase(req.user.id, {
        purchaseId: purchaseIdRaw,
        itemId: itemIdRaw,
        priceStars: priceStarsRaw,
        purchaseType: normalizePurchaseType(purchaseTypeRaw),
        metadata: typeof metadataRaw === 'object' && metadataRaw !== null ? (metadataRaw as Record<string, unknown>) : undefined,
      });

      res.status(200).json({
        success: true,
        purchase: {
          purchase_id: purchase.purchaseId,
          status: purchase.status,
          item_id: purchase.itemId,
          price_stars: purchase.priceStars,
          purchase_type: purchase.purchaseType,
          created_at: purchase.createdAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  webhook = (_req: Request, res: Response) => {
    // TODO: verify Telegram signature, update purchases, grant rewards
    res.status(202).json({ success: true, message: 'webhook_stub' });
  };

  packs = (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const packs = contentService.getStarPacks();
      res.status(200).json({ packs });
    } catch (error) {
      next(error);
    }
  };
}
