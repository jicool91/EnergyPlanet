import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { leaderboardService } from '../../services/LeaderboardService';
import { profileService } from '../../services/ProfileService';
import { AppError } from '../../middleware/errorHandler';

export class SocialController {
  leaderboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
      const viewerId = req.user?.id;
      const data = await leaderboardService.getLeaderboard(viewerId, limitParam);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  profile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        throw new AppError(400, 'user_id_required');
      }

      const profile = await profileService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  };
}
