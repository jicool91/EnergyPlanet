import { AppError } from '../middleware/errorHandler';
import { contentService } from './ContentService';
import { constructionService } from './ConstructionService';

interface UpgradeV2Request {
  buildingId: string;
  action: 'build' | 'upgrade';
  quantity?: number;
}

export class UpgradeServiceV2 {
  async enqueue(userId: string, request: UpgradeV2Request) {
    const building = contentService.getBuilding(request.buildingId);
    if (!building) {
      throw new AppError(404, 'building_not_found');
    }
    return constructionService.queueJob(userId, {
      buildingId: request.buildingId,
      action: request.action,
      quantity: request.quantity,
    });
  }
}

export const upgradeServiceV2 = new UpgradeServiceV2();
