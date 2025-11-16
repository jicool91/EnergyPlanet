import { transaction } from '../db/connection';
import {
  ensureBaseBuilder,
  listBuilders,
  unlockBuilder,
  updateBuilderStatus,
  type BuilderRecord,
} from '../repositories/BuilderRepository';
import { adjustStarsBalance } from '../repositories/ProgressRepository';

interface UnlockOptions {
  slotIndex: number;
  costStars?: number;
  durationSeconds?: number | null;
  speedMultiplier?: number;
}

export class BuilderService {
  async list(userId: string): Promise<BuilderRecord[]> {
    return listBuilders(userId);
  }

  async ensureBase(userId: string): Promise<BuilderRecord> {
    return ensureBaseBuilder(userId);
  }

  async unlockWithStars(userId: string, options: UnlockOptions): Promise<BuilderRecord> {
    return transaction(async client => {
      if (options.costStars && options.costStars > 0) {
        await adjustStarsBalance(userId, -options.costStars, client);
      }
      const expiresAt = options.durationSeconds
        ? new Date(Date.now() + options.durationSeconds * 1000)
        : null;
      return unlockBuilder(
        {
          userId,
          slotIndex: options.slotIndex,
          speedMultiplier: options.speedMultiplier ?? 1,
          expiresAt,
        },
        client
      );
    });
  }

  async deactivate(userId: string, slotIndex: number): Promise<void> {
    await updateBuilderStatus(userId, slotIndex, 'inactive');
  }

  async expire(userId: string): Promise<void> {
    const builders = await listBuilders(userId);
    const now = Date.now();
    await Promise.all(
      builders
        .filter(builder => builder.expiresAt && builder.expiresAt.getTime() <= now)
        .map(builder => updateBuilderStatus(builder.userId, builder.slotIndex, 'expired'))
    );
  }
}

export const builderService = new BuilderService();
