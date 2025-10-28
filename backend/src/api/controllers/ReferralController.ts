import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { referralService } from '../../services/ReferralService';

type ReferralActivateBody = {
  code?: unknown;
};

type ReferralActivateRequest = AuthRequest & { body: ReferralActivateBody };

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

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

  activate = async (req: ReferralActivateRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const rawBody: unknown = req.body;
      const codeRaw = isPlainObject(rawBody) ? rawBody.code : undefined;
      const code = typeof codeRaw === 'string' ? codeRaw.trim() : String(codeRaw ?? '').trim();
      if (!code) {
        throw new AppError(400, 'referral_code_required');
      }
      const summary = await referralService.activateCode(req.user.id, code);
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
