import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { leaderboardService } from '../../services/LeaderboardService';
import { profileService } from '../../services/ProfileService';
import { AppError } from '../../middleware/errorHandler';
import { friendsService } from '../../services/FriendsService';

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

  friends = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const list = await friendsService.list(req.user.id);
      res.status(200).json(list);
    } catch (error) {
      next(error);
    }
  };

  sendFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const { targetUserId } = (req.body ?? {}) as { targetUserId?: unknown };
      if (typeof targetUserId !== 'string' || targetUserId.trim().length === 0) {
        throw new AppError(400, 'target_user_id_required');
      }

      await friendsService.sendRequest(req.user.id, targetUserId.trim());
      res.status(202).json({ status: 'pending' });
    } catch (error) {
      next(error);
    }
  };

  acceptFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const { userId } = req.params;
      if (!userId || userId.trim().length === 0) {
        throw new AppError(400, 'user_id_required');
      }

      await friendsService.acceptRequest(req.user.id, userId.trim());
      res.status(200).json({ status: 'accepted' });
    } catch (error) {
      next(error);
    }
  };

  rejectFriendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const { userId } = req.params;
      if (!userId || userId.trim().length === 0) {
        throw new AppError(400, 'user_id_required');
      }

      await friendsService.declineRequest(req.user.id, userId.trim());
      res.status(200).json({ status: 'declined' });
    } catch (error) {
      next(error);
    }
  };

  removeFriend = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const { userId } = req.params;
      if (!userId || userId.trim().length === 0) {
        throw new AppError(400, 'user_id_required');
      }

      await friendsService.removeFriend(req.user.id, userId.trim());
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
