import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { questService } from '../../services/QuestService';

export class QuestController {
  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const quests = await questService.list(req.user.id);
      res.status(200).json({ quests });
    } catch (error) {
      next(error);
    }
  };

  claim = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { questId } = req.params;
      if (!questId) {
        throw new AppError(400, 'quest_id_required');
      }

      const quest = await questService.claim(req.user.id, questId);
      res.status(200).json({ quest });
    } catch (error) {
      next(error);
    }
  };
}

export const questController = new QuestController();
