import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { constructionService } from '../../services/ConstructionService';
import { builderService } from '../../services/BuilderService';
import type { BuilderRecord } from '../../repositories/BuilderRepository';
import type { ConstructionJobRecord } from '../../repositories/ConstructionRepository';

interface ConstructionStartBody {
  building_id?: unknown;
  action?: unknown;
  quantity?: unknown;
}

interface BuilderActivateBody {
  slot_index?: unknown;
  cost_stars?: unknown;
  duration_seconds?: unknown;
}

export class ConstructionController {
  listSnapshot = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const snapshot = await constructionService.getSnapshot(req.user.id);
      res.status(200).json({
        builders: snapshot.builders.map(this.mapBuilder),
        jobs: {
          active: snapshot.jobs.active.map(this.mapJob),
          queued: snapshot.jobs.queued.map(this.mapJob),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  startJob = async (
    req: AuthRequest & { body: ConstructionStartBody },
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const body = req.body ?? {};
      const buildingIdRaw = body.building_id;
      if (typeof buildingIdRaw !== 'string') {
        throw new AppError(400, 'building_id_required');
      }
      const actionRaw = body.action === 'upgrade' ? 'upgrade' : 'build';
      const quantity = typeof body.quantity === 'number' ? body.quantity : 1;
      const job = await constructionService.queueJob(req.user.id, {
        buildingId: buildingIdRaw,
        action: actionRaw,
        quantity,
      });
      res.status(200).json(this.mapJob(job));
    } catch (error) {
      next(error);
    }
  };

  completeJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const { jobId } = req.params as { jobId?: string };
      if (!jobId) {
        throw new AppError(400, 'job_id_required');
      }
      const result = await constructionService.completeJob(req.user.id, jobId);
      res.status(200).json({
        job: this.mapJob(result.job),
        xp_awarded: result.xpAwarded,
        new_level: result.newLevel,
      });
    } catch (error) {
      next(error);
    }
  };

  listBuilders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const builders = await builderService.list(req.user.id);
      res.status(200).json({ builders: builders.map(this.mapBuilder) });
    } catch (error) {
      next(error);
    }
  };

  activateBuilder = async (
    req: AuthRequest & { body: BuilderActivateBody },
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }
      const body = req.body ?? {};
      const slotIndex = typeof body.slot_index === 'number' ? body.slot_index : 1;
      const costStars = typeof body.cost_stars === 'number' ? body.cost_stars : undefined;
      const durationSeconds = typeof body.duration_seconds === 'number' ? body.duration_seconds : undefined;
      const builder = await builderService.unlockWithStars(req.user.id, {
        slotIndex,
        costStars,
        durationSeconds,
      });
      res.status(200).json(this.mapBuilder(builder));
    } catch (error) {
      next(error);
    }
  };

  private mapBuilder = (builder: BuilderRecord) => ({
    slot_index: builder.slotIndex,
    status: builder.status,
    speed_multiplier: builder.speedMultiplier,
    expires_at: builder.expiresAt ? builder.expiresAt.toISOString() : null,
  });

  private mapJob = (job: ConstructionJobRecord) => ({
    id: job.id,
    building_id: job.buildingId,
    action: job.action,
    builder_slot: job.builderSlot,
    completes_at: job.completesAt.toISOString(),
    duration_seconds: job.durationSeconds,
    status: job.status,
    xp_reward: job.xpReward,
    quantity: job.quantity,
  });
}
