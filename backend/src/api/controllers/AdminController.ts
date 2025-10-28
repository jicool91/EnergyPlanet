/**
 * Admin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/AdminService';
import { MonetizationAnalyticsService } from '../../services/MonetizationAnalyticsService';

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
}
