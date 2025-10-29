/**
 * Admin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/AdminService';
import { MonetizationAnalyticsService } from '../../services/MonetizationAnalyticsService';
import { AppError } from '../../middleware/errorHandler';

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

      const reason = typeof req.body?.reason === 'string' ? req.body.reason : undefined;
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
