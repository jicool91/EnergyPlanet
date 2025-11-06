/**
 * Admin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/AdminService';
import { MonetizationAnalyticsService } from '../../services/MonetizationAnalyticsService';
import { AppError } from '../../middleware/errorHandler';
import { AuthRequest } from '../../middleware/auth';

export class AdminController {
  private adminService: AdminService;
  private monetizationAnalyticsService: MonetizationAnalyticsService;

  constructor() {
    this.adminService = new AdminService();
    this.monetizationAnalyticsService = new MonetizationAnalyticsService();
  }

  getMigrationStatus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.adminService.getMigrationStatus();
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  };

  getFullHealth = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await this.adminService.getFullHealthStatus();
      res.status(status.status === 'ok' ? 200 : 503).json(status);
    } catch (error) {
      next(error);
    }
  };

  getMonetizationMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const daysParam = req.query.days ? Number(req.query.days) : undefined;
      const metrics = await this.monetizationAnalyticsService.getDailyMetrics(daysParam);
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  };

  getSeasonSnapshot = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await this.adminService.getLatestSeasonSnapshot();
      if (!snapshot) {
        res.status(404).json({ error: 'season_snapshot_not_found' });
        return;
      }
      res.status(200).json(snapshot);
    } catch (error) {
      next(error);
    }
  };

  rewardSeasonPlacement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { seasonId } = req.params;
      if (!seasonId || seasonId.trim().length === 0) {
        throw new AppError(400, 'season_id_required');
      }

      const { userId, rewardTier, couponCode, note } = (req.body ?? {}) as {
        userId?: unknown;
        rewardTier?: unknown;
        couponCode?: unknown;
        note?: unknown;
      };

      if (typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(400, 'user_id_required');
      }

      const normalizedTier = typeof rewardTier === 'string' ? rewardTier.toLowerCase().trim() : '';
      if (!['gold', 'silver', 'bronze'].includes(normalizedTier)) {
        throw new AppError(400, 'invalid_reward_tier');
      }

      const normalizedCoupon =
        typeof couponCode === 'string' && couponCode.trim().length > 0
          ? couponCode.trim()
          : undefined;
      const normalizedNote =
        typeof note === 'string' && note.trim().length > 0 ? note.trim() : undefined;

      const result = await this.adminService.rewardSeasonPlacement({
        seasonId: seasonId.trim(),
        userId: userId.trim(),
        rewardTier: normalizedTier as 'gold' | 'silver' | 'bronze',
        couponCode: normalizedCoupon,
        note: normalizedNote,
        grantedBy: req.user?.id ?? null,
      });

      res.status(202).json({
        status: 'accepted',
        rewardId: result.rewardId,
      });
    } catch (error) {
      next(error);
    }
  };

  listAuthSessionFamilies = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, limit, offset } = req.query;
      const result = await this.adminService.listAuthSessionFamilies({
        userId:
          typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : undefined,
        limit: typeof limit === 'string' ? Number(limit) : undefined,
        offset: typeof offset === 'string' ? Number(offset) : undefined,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  revokeSessionFamily = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { familyId } = req.params;
      if (!familyId || familyId.trim().length === 0) {
        throw new AppError(400, 'family_id_required');
      }

      const rawReason =
        typeof (req.body as { reason?: unknown } | undefined)?.reason === 'string'
          ? ((req.body as { reason: string }).reason ?? '').trim()
          : undefined;
      const reason = rawReason && rawReason.length > 0 ? rawReason : undefined;
      const result = await this.adminService.revokeSessionFamily(familyId.trim(), reason);

      if (!result.userId) {
        res.status(404).json({
          error: 'session_family_not_found',
          familyId,
        });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
