import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { prestigeService } from '../../services/PrestigeService';

export class PrestigeController {
  status = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const status = await prestigeService.getStatus(req.user.id);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  };

  perform = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const result = await prestigeService.performPrestige(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
