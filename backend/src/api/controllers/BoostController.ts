import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { boostService } from '../../services/BoostService';

export class BoostController {
  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const hub = await boostService.getBoostHub(req.user.id);
      res.status(200).json(hub);
    } catch (error) {
      next(error);
    }
  };

  claim = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const boostTypeRaw =
        typeof req.body === 'object' && req.body !== null && 'boost_type' in req.body
          ? (req.body as { boost_type?: unknown }).boost_type
          : undefined;

      if (typeof boostTypeRaw !== 'string') {
        throw new AppError(400, 'boost_type_required');
      }

      const allowedBoostTypes = ['ad_boost', 'daily_boost', 'premium_boost'] as const;
      type BoostType = (typeof allowedBoostTypes)[number];

      if (!allowedBoostTypes.includes(boostTypeRaw as BoostType)) {
        throw new AppError(400, 'boost_type_invalid');
      }
      const boostType = boostTypeRaw as BoostType;

      const boost = await boostService.claimBoost(req.user.id, boostType);

      res.status(200).json({
        success: true,
        boost: {
          id: boost.id,
          boost_type: boost.boostType,
          multiplier: boost.multiplier,
          expires_at: boost.expiresAt.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
