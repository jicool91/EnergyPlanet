/**
 * Admin Controller
 */

import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../../services/AdminService';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
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
}
