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

      const body =
        typeof req.body === 'object' && req.body !== null
          ? (req.body as Record<string, unknown>)
          : {};

      const tapCountValue = (body.tap_count ?? body.tapCount) as unknown;
      const tapCount = Number(tapCountValue ?? 1);
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

      const body =
        typeof req.body === 'object' && req.body !== null
          ? (req.body as Record<string, unknown>)
          : {};

      const timeDeltaValue = (body.time_delta ?? body.timeDelta) as unknown;
      const timeDelta = Number(timeDeltaValue ?? 0);
      const result = await this.tickService.applyTick(req.user.id, timeDelta);

      const issuedTokens = req.authContext?.issuedTokens;
      const responsePayload: Record<string, unknown> = {
        ...result,
      };

      if (issuedTokens) {
        Object.assign(responsePayload, {
          access_token: issuedTokens.accessToken,
          refresh_token: issuedTokens.refreshToken,
          refresh_expires_at: issuedTokens.refreshExpiresAt,
          expires_in: issuedTokens.expiresIn,
          auth_strategy: req.authContext?.strategy ?? 'tma',
        });
      }

      res.status(200).json(responsePayload);
    } catch (error) {
      next(error);
    }
  };

  upgrade = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const body =
        typeof req.body === 'object' && req.body !== null
          ? (req.body as Record<string, unknown>)
          : {};

      const buildingIdRaw = (body.building_id ?? body.buildingId) as unknown;
      if (typeof buildingIdRaw !== 'string' || buildingIdRaw.trim().length === 0) {
        throw new AppError(400, 'building_id_required');
      }

      const actionRaw = (body.action ?? 'purchase') as unknown;
      const action = actionRaw === 'upgrade' ? 'upgrade' : 'purchase';
      const quantitySource = action === 'purchase' ? (body.quantity ?? body.count) : 1;
      const quantity = Number(quantitySource ?? 1);

      const result = await this.upgradeService.processUpgrade(req.user.id, {
        buildingId: buildingIdRaw.trim(),
        action,
        quantity,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
