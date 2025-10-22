import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { contentService } from '../../services/ContentService';

export class BuildingController {
  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const buildings = contentService.getBuildings();

      const enriched = buildings.map(building => {
        const baseIncome = Number(building.base_income ?? 0);
        const baseCost = Number(building.base_cost ?? 0);
        const paybackSeconds = baseIncome > 0 ? baseCost / baseIncome : null;

        return {
          id: building.id,
          name: building.name,
          description: building.description,
          tier: building.tier ?? null,
          base_income: baseIncome,
          base_cost: baseCost,
          cost_multiplier: building.cost_multiplier ?? null,
          upgrade_cost_multiplier: building.upgrade_cost_multiplier ?? null,
          upgrade_income_bonus: building.upgrade_income_bonus ?? null,
          unlock_level: building.unlock_level ?? null,
          max_count: building.max_count ?? null,
          category: building.category ?? null,
          rarity: building.rarity ?? null,
          payback_seconds: paybackSeconds,
        };
      });

      const sortedByPayback = enriched
        .filter(b => typeof b.payback_seconds === 'number' && b.payback_seconds! > 0)
        .sort((a, b) => (a.payback_seconds! - b.payback_seconds!));

      const roiRankMap = new Map<string, number>();
      sortedByPayback.forEach((building, index) => {
        roiRankMap.set(building.id, index + 1);
      });

      const payload = enriched.map(building => ({
        ...building,
        roi_rank: roiRankMap.get(building.id) ?? null,
      }));

      res.status(200).json({ buildings: payload });
    } catch (error) {
      next(error);
    }
  };
}

export const buildingController = new BuildingController();
