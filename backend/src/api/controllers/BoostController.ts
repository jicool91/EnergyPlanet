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

      const { boost_type } = req.body;
      if (!boost_type) {
        throw new AppError(400, 'boost_type_required');
      }

      const boost = await boostService.claimBoost(req.user.id, boost_type);

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
