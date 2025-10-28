import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { referralService } from '../../services/ReferralService';

class ReferralController {
  summary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const summary = await referralService.getSummary(req.user.id);
      res.status(200).json({ referral: summary });
    } catch (error) {
      next(error);
    }
  };

  activate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { code } = req.body;
      const summary = await referralService.activateCode(req.user.id, String(code ?? '').trim());
      res.status(200).json({ referral: summary });
    } catch (error) {
      next(error);
    }
  };

  claimMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { milestoneId } = req.params;
      if (!milestoneId) {
        throw new AppError(400, 'milestone_id_required');
      }

      const summary = await referralService.claimMilestone(req.user.id, milestoneId);
      res.status(200).json({ referral: summary });
    } catch (error) {
      next(error);
    }
  };
}

export const referralController = new ReferralController();
