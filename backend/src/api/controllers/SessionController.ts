import { Response, NextFunction } from 'express';
import { SessionService } from '../../services/SessionService';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

export class SessionController {
  private readonly sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  openSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const session = await this.sessionService.openSession(req.user.id);
      res.status(200).json(session);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      await this.sessionService.recordLogout(req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
