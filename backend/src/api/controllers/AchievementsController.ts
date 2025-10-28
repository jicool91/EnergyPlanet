import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { achievementService } from '../../services/AchievementService';

export class AchievementsController {
  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const overview = await achievementService.getOverview(req.user.id);
      res.status(200).json(overview);
    } catch (error) {
      next(error);
    }
  };

  claim = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const slug = req.params.slug;
      if (!slug) {
        throw new AppError(400, 'achievement_slug_required');
      }

      const result = await achievementService.claimNextTier(req.user.id, slug);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
