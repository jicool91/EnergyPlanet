import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { cosmeticService } from '../../services/CosmeticService';

export class CosmeticController {
  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const cosmetics = await cosmeticService.listCosmetics(req.user.id);
      res.status(200).json({ cosmetics });
    } catch (error) {
      next(error);
    }
  };

  purchase = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const cosmeticIdRaw =
        typeof req.body === 'object' && req.body !== null && 'cosmetic_id' in req.body
          ? (req.body as { cosmetic_id?: unknown }).cosmetic_id
          : undefined;

      if (typeof cosmeticIdRaw !== 'string' || cosmeticIdRaw.trim().length === 0) {
        throw new AppError(400, 'cosmetic_id_required');
      }

      await cosmeticService.purchaseCosmetic(req.user.id, cosmeticIdRaw.trim());
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  equip = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const cosmeticIdRaw =
        typeof req.body === 'object' && req.body !== null && 'cosmetic_id' in req.body
          ? (req.body as { cosmetic_id?: unknown }).cosmetic_id
          : undefined;

      if (typeof cosmeticIdRaw !== 'string' || cosmeticIdRaw.trim().length === 0) {
        throw new AppError(400, 'cosmetic_id_required');
      }

      await cosmeticService.equipCosmetic(req.user.id, cosmeticIdRaw.trim());
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
