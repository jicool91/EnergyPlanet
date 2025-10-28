import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { TapService } from '../../services/TapService';
import { UpgradeService } from '../../services/UpgradeService';
import { TickService } from '../../services/TickService';

interface TapRequestBody {
  tap_count?: unknown;
  tapCount?: unknown;
}

interface TickRequestBody {
  time_delta?: unknown;
  timeDelta?: unknown;
}

interface UpgradeRequestBody {
  building_id?: unknown;
  buildingId?: unknown;
  action?: unknown;
  quantity?: unknown;
  count?: unknown;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export class GameplayController {
  private readonly tapService = new TapService();
  private readonly upgradeService = new UpgradeService();
  private readonly tickService = new TickService();

  tap = async (req: AuthRequest & { body: TapRequestBody }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const rawBody: unknown = req.body;
      const body = isPlainObject(rawBody) ? rawBody : {};
      const tapCountValue = body.tap_count ?? body.tapCount;
      const tapCount = typeof tapCountValue === 'number' ? tapCountValue : Number(tapCountValue ?? 1);
      const result = await this.tapService.processTap(req.user.id, tapCount);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  tick = async (req: AuthRequest & { body: TickRequestBody }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const rawBody: unknown = req.body;
      const body = isPlainObject(rawBody) ? rawBody : {};
      const timeDeltaValue = body.time_delta ?? body.timeDelta;
      const timeDelta = typeof timeDeltaValue === 'number' ? timeDeltaValue : Number(timeDeltaValue ?? 0);
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

  upgrade = async (req: AuthRequest & { body: UpgradeRequestBody }, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const rawBody: unknown = req.body;
      const body = isPlainObject(rawBody) ? rawBody : {};
      const buildingIdRaw = body.building_id ?? body.buildingId;
      if (typeof buildingIdRaw !== 'string' || buildingIdRaw.trim().length === 0) {
        throw new AppError(400, 'building_id_required');
      }

      const actionRaw = body.action;
      const action = actionRaw === 'upgrade' ? 'upgrade' : 'purchase';
      const quantitySource = action === 'purchase' ? (body.quantity ?? body.count) : 1;
      const quantity = typeof quantitySource === 'number' ? quantitySource : Number(quantitySource ?? 1);

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
