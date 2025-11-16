import { PoolClient } from 'pg';
import { transaction } from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import { contentService } from './ContentService';
import {
  createConstructionJob,
  listActiveJobs,
  updateJobStatus,
  markJobClaimed,
  findJobById,
  type ConstructionJobRecord,
  startConstructionJob,
} from '../repositories/ConstructionRepository';
import { ensureBaseBuilder, listBuilders } from '../repositories/BuilderRepository';
import { calculateConstructionXpReward } from '../utils/constructionXp';
import { getProgress, updateProgress } from '../repositories/ProgressRepository';
import { calculateLevelProgressV2, cumulativeXpToLevel, MAX_LEVEL_V2 } from '../utils/levelV2';
import { logger } from '../utils/logger';
import { listInventory, upsertInventoryItem } from '../repositories/InventoryRepository';
import { invalidateProfileCache } from '../cache/invalidation';
import { achievementService } from './AchievementService';

interface QueueJobInput {
  buildingId: string;
  action: 'build' | 'upgrade';
  quantity?: number;
  qualityMultiplier?: number;
}

interface CompleteJobResult {
  job: ConstructionJobRecord;
  xpAwarded: number;
  newLevel: number;
}

export class ConstructionService {
  async queueJob(userId: string, input: QueueJobInput): Promise<ConstructionJobRecord> {
    return transaction(async client => {
      const progress = await getProgress(userId, client);
      if (!progress) {
        throw new AppError(404, 'progress_not_found');
      }

      const building = contentService.getBuilding(input.buildingId);
      if (!building) {
        throw new AppError(404, 'building_not_found');
      }

      const builders = await listBuilders(userId, client);
      if (!builders.length) {
        await ensureBaseBuilder(userId, client);
      }
      const refreshedBuilders = builders.length ? builders : await listBuilders(userId, client);
      const activeJobs = await listActiveJobs(userId, client);
      const busySlots = new Set(
        activeJobs.filter(job => job.status === 'running').map(job => job.builderSlot)
      );
      const activeBuilder = refreshedBuilders.find(
        builder => builder.status === 'active' && !busySlots.has(builder.slotIndex)
      );

      const inventory = await listInventory(userId, client);
      const existing = inventory.find(item => item.buildingId === input.buildingId) ?? null;
      const ownedOfTier = inventory.reduce((sum, record) => {
        const recordBuilding = contentService.getBuilding(record.buildingId);
        if (!recordBuilding) {
          return sum;
        }
        return recordBuilding.tier === building.tier ? sum + record.count : sum;
      }, 0);

      const currentCount = existing?.count ?? 0;
      const playerMaxForLevel = contentService.getMaxBuildingCount(progress.level);
      if (input.action === 'build' && currentCount >= playerMaxForLevel) {
        throw new AppError(400, 'player_building_cap_reached');
      }
      const currentLevel = existing?.level ?? 0;
      const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
      const cost = input.action === 'upgrade'
        ? contentService.getBuildingUpgradeCost(building, currentLevel)
        : contentService.getBuildingCost(building, currentCount);
      if (progress.energy < cost) {
        throw new AppError(400, 'not_enough_energy');
      }

      const builderSpeed = activeBuilder?.speedMultiplier ?? refreshedBuilders[0]?.speedMultiplier ?? 1;
      const durationMinutes = contentService.calculateConstructionDurationMinutes(building, {
        ownedOfTier,
        builderSpeedMultiplier: builderSpeed,
        action: input.action,
        currentLevel,
      });
      const durationSeconds = Math.round(durationMinutes * 60);
      const startsNow = new Date();
      const scheduledStart = activeBuilder ? startsNow : null;
      const completesAt = scheduledStart
        ? new Date(scheduledStart.getTime() + durationSeconds * 1000)
        : startsNow;
      const xpReward = calculateConstructionXpReward({
        tier: (building.tier ?? 1) as 1 | 2 | 3 | 4,
        durationMinutes,
        buildingLevel: currentLevel,
        playerLevel: progress.level,
        qualityMultiplier: input.qualityMultiplier,
      });

      const builderSlot = (activeBuilder ?? refreshedBuilders[0]).slotIndex;
      const status = activeBuilder ? 'running' : 'queued';

      const job = await createConstructionJob(
        {
          userId,
          buildingId: input.buildingId,
          action: input.action,
          tier: building.tier ?? 1,
          quantity,
          targetLevel: input.action === 'upgrade' ? currentLevel + 1 : currentLevel,
          durationSeconds,
          completesAt,
          builderSlot,
          xpReward: xpReward.appliedXp,
          energyCost: cost,
          qualityMultiplier: input.qualityMultiplier ?? 1,
          status,
          metadata: {
            estimated_minutes: durationMinutes,
            xp_raw: xpReward.rawXp,
          },
        },
        client
      );

      await updateProgress(
        userId,
        {
          energy: progress.energy - cost,
        },
        client
      );

      await invalidateProfileCache(userId);

      return job;
    });
  }

  async getSnapshot(userId: string, client?: PoolClient) {
    const run = async (runner: PoolClient) => {
      let builders = await listBuilders(userId, runner);
      if (!builders.length) {
        await ensureBaseBuilder(userId, runner);
        builders = await listBuilders(userId, runner);
      }
      const jobs = await listActiveJobs(userId, runner);
      return {
        builders,
        jobs: {
          active: jobs.filter(job => job.status === 'running'),
          queued: jobs.filter(job => job.status === 'queued'),
        },
      };
    };

    if (client) {
      return run(client);
    }
    return transaction(run);
  }

  async startQueuedJobs(userId: string): Promise<void> {
    await transaction(async client => {
      const builders = await listBuilders(userId, client);
      if (!builders.length) {
        await ensureBaseBuilder(userId, client);
      }
      const activeJobs = await listActiveJobs(userId, client);
      const busySlots = new Set(
        activeJobs.filter(job => job.status === 'running').map(job => job.builderSlot)
      );
      for (const job of activeJobs.filter(job => job.status === 'queued')) {
        const availableBuilder = builders.find(
          builder => builder.status === 'active' && !busySlots.has(builder.slotIndex)
        );
        if (!availableBuilder) {
          break;
        }
        busySlots.add(availableBuilder.slotIndex);
        const durationSeconds = job.durationSeconds;
        const completesAt = new Date(Date.now() + durationSeconds * 1000);
        await startConstructionJob(job.id, completesAt, availableBuilder.slotIndex, client);
      }
    });
  }

  async completeJob(userId: string, jobId: string): Promise<CompleteJobResult> {
    return transaction(async client => {
      const job = await findJobById(jobId, client);
      if (!job || job.userId !== userId) {
        throw new AppError(404, 'construction_job_not_found');
      }
      if (job.status !== 'running') {
        throw new AppError(409, 'job_not_running');
      }
      const progress = await getProgress(userId, client);
      if (!progress) {
        throw new AppError(404, 'progress_not_found');
      }

      const now = new Date();
      if (job.completesAt.getTime() > now.getTime()) {
        throw new AppError(409, 'job_not_ready');
      }

      await updateJobStatus(job.id, 'completed', client);
      await markJobClaimed(job.id, client);

      const totalXp = Math.min(progress.xp + job.xpReward, Number.MAX_SAFE_INTEGER);
      const levelInfo = calculateLevelProgressV2(totalXp);
      const leveledUp = levelInfo.level !== progress.level;
      const cappedLevel = Math.min(levelInfo.level, MAX_LEVEL_V2);
      const cumulativeBeforeLevel = cappedLevel === MAX_LEVEL_V2 ? cumulativeXpToLevel(MAX_LEVEL_V2 - 1) : 0;
      const xpOverflow = cappedLevel === MAX_LEVEL_V2 ? Math.max(0, totalXp - cumulativeBeforeLevel) : 0;

      if (job.action === 'build') {
        await upsertInventoryItem(userId, job.buildingId, job.quantity, 0, client);
      } else {
        await upsertInventoryItem(userId, job.buildingId, 0, 1, client);
      }

      const updated = await updateProgress(
        userId,
        {
          xp: totalXp,
          level: cappedLevel,
          xpOverflow,
          levelCapReachedAt: leveledUp && cappedLevel === MAX_LEVEL_V2 ? new Date() : undefined,
          totalBuildingsPurchased:
            job.action === 'build'
              ? progress.totalBuildingsPurchased + job.quantity
              : progress.totalBuildingsPurchased,
        },
        client
      );

      if (job.action === 'build') {
        await achievementService.syncMetric(
          userId,
          'buildings_owned',
          updated.totalBuildingsPurchased,
          client
        );
      }

      await invalidateProfileCache(userId);

      logger.info(
        {
          userId,
          jobId: job.id,
          xpAwarded: job.xpReward,
          newLevel: updated.level,
          leveledUp,
        },
        'construction_job_completed'
      );

      return {
        job: { ...job, status: 'completed' },
        xpAwarded: job.xpReward,
        newLevel: updated.level,
      };
    });
  }

}

export const constructionService = new ConstructionService();
