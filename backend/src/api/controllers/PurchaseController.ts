import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { purchaseService } from '../../services/PurchaseService';
import { contentService } from '../../services/ContentService';

export class PurchaseController {
  invoice = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { purchase_id, item_id, price_stars, purchase_type, metadata } = req.body;

      if (!purchase_id || !item_id || typeof price_stars !== 'number') {
        throw new AppError(400, 'invalid_purchase_payload');
      }

      const invoice = await purchaseService.createInvoice(req.user.id, {
        purchaseId: purchase_id,
        itemId: item_id,
        priceStars: price_stars,
        purchaseType: purchase_type ?? 'unknown',
        metadata,
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

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { purchase_id, item_id, price_stars, purchase_type, metadata } = req.body;

      if (!purchase_id || !item_id || typeof price_stars !== 'number') {
        throw new AppError(400, 'invalid_purchase_payload');
      }

      const purchase = await purchaseService.recordMockPurchase(req.user.id, {
        purchaseId: purchase_id,
        itemId: item_id,
        priceStars: price_stars,
        purchaseType: purchase_type ?? 'unknown',
        metadata,
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

  webhook = async (_req: Request, res: Response) => {
    // TODO: verify Telegram signature, update purchases, grant rewards
    res.status(202).json({ success: true, message: 'webhook_stub' });
  };

  packs = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const packs = contentService.getStarPacks();
      res.status(200).json({ packs });
    } catch (error) {
      next(error);
    }
  };
}
