import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { TapService } from '../../services/TapService';
import { UpgradeService } from '../../services/UpgradeService';
import { TickService } from '../../services/TickService';

export class GameplayController {
  private readonly tapService = new TapService();
  private readonly upgradeService = new UpgradeService();
  private readonly tickService = new TickService();

  tap = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const tapCount = Number(req.body.tap_count ?? req.body.tapCount ?? 1);
      const result = await this.tapService.processTap(req.user.id, tapCount);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  tick = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const timeDelta = Number(req.body.time_delta ?? req.body.timeDelta ?? 1);
      const result = await this.tickService.applyTick(req.user.id, timeDelta);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  upgrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const buildingId = (req.body.building_id ?? req.body.buildingId) as string;
      const action = (req.body.action ?? 'purchase') as 'purchase' | 'upgrade';
      const quantityInput =
        action === 'purchase'
          ? Number(req.body.quantity ?? req.body.count ?? 1)
          : 1;

      const result = await this.upgradeService.processUpgrade(req.user.id, {
        buildingId,
        action,
        quantity: quantityInput,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
