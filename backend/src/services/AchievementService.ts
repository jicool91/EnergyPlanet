import { PoolClient } from 'pg';
import { transaction } from '../db/connection';
import {
  AchievementDefinition,
  AchievementTier,
  listAchievementDefinitions,
  listDefinitionsByMetric,
  listUserAchievementProgress,
  upsertUserAchievementProgress,
  updateUserAchievementTier,
  ensureUserAchievementRow,
  getAchievementDefinitionBySlug,
} from '../repositories/AchievementRepository';
import { getProgress, updateProgress } from '../repositories/ProgressRepository';
import { logEvent } from '../repositories/EventRepository';
import { AppError } from '../middleware/errorHandler';
import { invalidateProfileCache } from '../cache/invalidation';
import { addUserCosmetic, hasUserCosmetic } from '../repositories/UserCosmeticsRepository';
import {
  recordAchievementClaimedMetric,
  recordAchievementCosmeticMetric,
  recordAchievementUnlockedMetric,
  recordCosmeticGrantedMetric,
} from '../metrics/gameplay';

type AchievementMetric = 'total_energy' | 'total_taps' | 'buildings_owned' | 'prestige_level';

const ACHIEVEMENT_COSMETIC_REWARDS: Record<string, Array<{ tier: number; cosmeticId: string }>> = {
  tap_maestro: [
    { tier: 2, cosmeticId: 'spark_effect' },
    { tier: 4, cosmeticId: 'explosion_effect' },
  ],
  builder_guild: [
    { tier: 2, cosmeticId: 'mars_skin' },
    { tier: 4, cosmeticId: 'cyber_planet_skin' },
  ],
  prestige_voyager: [
    { tier: 1, cosmeticId: 'diamond_frame_001' },
  ],
};

export interface AchievementTierStatus extends AchievementTier {
  earned: boolean;
  claimable: boolean;
}

export interface AchievementViewModel {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
  metric: string;
  unit: string;
  maxTier: number;
  currentTier: number;
  highestUnlockedTier: number;
  progressValue: number;
  nextThreshold: number | null;
  progressRatio: number;
  tiers: AchievementTierStatus[];
  claimableTier: number | null;
  claimedMultiplier: number;
  pendingMultiplier: number;
}

interface SyncResult {
  slug: string;
  newlyUnlockedTiers: number[];
}

function computeHighestUnlocked(definition: AchievementDefinition, progressValue: number): number {
  if (!Array.isArray(definition.tiers) || definition.tiers.length === 0) {
    return 0;
  }

  let highest = 0;
  for (const tier of definition.tiers) {
    if (progressValue >= tier.threshold) {
      highest = Math.max(highest, tier.tier);
    }
  }
  return Math.min(highest, definition.maxTier);
}

function computeClaimedMultiplier(
  definition: AchievementDefinition,
  currentTier: number
): number {
  if (currentTier <= 0) {
    return 1;
  }

  return definition.tiers
    .filter(t => t.tier <= currentTier)
    .reduce((acc, tier) => acc * tier.rewardMultiplier, 1);
}

export class AchievementService {
  async getOverview(userId: string): Promise<{ achievements: AchievementViewModel[] }> {
    const [definitions, userProgress] = await Promise.all([
      listAchievementDefinitions(),
      listUserAchievementProgress(userId),
    ]);

    const progressMap = new Map(userProgress.map(entry => [entry.achievementId, entry]));

    const achievements = definitions.map(def => {
      const progress = progressMap.get(def.id);
      const progressValue = progress?.progressValue ?? 0;
      const highestUnlockedStored = progress?.highestUnlockedTier ?? 0;
      const highestUnlockedComputed = computeHighestUnlocked(def, progressValue);
      const highestUnlocked = Math.max(highestUnlockedStored, highestUnlockedComputed);
      const currentTier = progress?.currentTier ?? 0;
      const claimableTier = highestUnlocked > currentTier ? currentTier + 1 : null;

      const nextThreshold =
        currentTier >= def.maxTier
          ? null
          : def.tiers.find(tier => tier.tier === currentTier + 1)?.threshold ?? null;

      let progressRatio = 0;
      if (nextThreshold && nextThreshold > 0) {
        progressRatio = Math.min(progressValue / nextThreshold, 1);
      } else if (currentTier >= def.maxTier) {
        progressRatio = 1;
      }

      const tiers: AchievementTierStatus[] = def.tiers.map(tier => ({
        ...tier,
        earned: tier.tier <= currentTier,
        claimable: tier.tier === currentTier + 1 && tier.tier <= highestUnlocked,
      }));

      const claimedMultiplier = computeClaimedMultiplier(def, currentTier);
      const pendingMultiplier =
        claimableTier !== null
          ? def.tiers
              .filter(tier => tier.tier > currentTier && tier.tier <= highestUnlocked)
              .reduce((acc, tier) => acc * tier.rewardMultiplier, 1)
          : 1;

      return {
        slug: def.slug,
        name: def.name,
        description: def.description,
        category: def.category,
        icon: def.icon,
        metric: def.metric,
        unit: def.unit,
        maxTier: def.maxTier,
        currentTier,
        highestUnlockedTier: highestUnlocked,
        progressValue,
        nextThreshold,
        progressRatio,
        tiers,
        claimableTier,
        claimedMultiplier,
        pendingMultiplier,
      };
    });

    return { achievements };
  }

  async syncMetric(
    userId: string,
    metric: AchievementMetric,
    progressValue: number,
    client?: PoolClient
  ): Promise<SyncResult[]> {
    if (progressValue < 0) {
      return [];
    }

    const definitions = await listDefinitionsByMetric(metric, client);
    if (!definitions.length) {
      return [];
    }

    const results: SyncResult[] = [];

    const progressRecords = await listUserAchievementProgress(userId, client);
    const progressMap = new Map(progressRecords.map(entry => [entry.achievementId, entry]));

    for (const def of definitions) {
      const highestUnlocked = computeHighestUnlocked(def, progressValue);
      const existing = progressMap.get(def.id);
      const previousUnlocked = existing?.highestUnlockedTier ?? 0;

      await upsertUserAchievementProgress(userId, def.id, progressValue, highestUnlocked, client);

      if (highestUnlocked > previousUnlocked) {
        const unlockedTiers: number[] = [];
        for (let tier = previousUnlocked + 1; tier <= highestUnlocked; tier += 1) {
          unlockedTiers.push(tier);
          await logEvent(
            userId,
            'achievement_unlocked',
            {
              achievement_slug: def.slug,
              tier,
              metric,
              progress_value: progressValue,
            },
            { client }
          );
          recordAchievementUnlockedMetric(def.slug, tier);
        }
        results.push({
          slug: def.slug,
          newlyUnlockedTiers: unlockedTiers,
        });
      }
    }

    return results;
  }

  async claimNextTier(userId: string, slug: string) {
    const result = await transaction(async client => {
      const definition = await getAchievementDefinitionBySlug(slug, client);
      if (!definition) {
        throw new AppError(404, 'achievement_not_found');
      }

      const tierLookup = new Map(definition.tiers.map(tier => [tier.tier, tier]));

      const progressRow = await ensureUserAchievementRow(userId, definition.id, client);
      const nextTier = progressRow.currentTier + 1;

      if (nextTier > definition.maxTier) {
        throw new AppError(400, 'achievement_maxed');
      }

      const highestUnlocked = computeHighestUnlocked(definition, progressRow.progressValue);
      if (nextTier > highestUnlocked && nextTier > progressRow.highestUnlockedTier) {
        throw new AppError(400, 'achievement_not_ready');
      }

      const tier = tierLookup.get(nextTier);
      if (!tier) {
        throw new AppError(500, 'achievement_tier_missing');
      }

      const updatedProgress = await updateUserAchievementTier(
        userId,
        definition.id,
        nextTier,
        client
      );

      const progress = await getProgress(userId, client);
      if (!progress) {
        throw new AppError(404, 'progress_not_found');
      }

      const newMultiplier = (progress.achievementMultiplier ?? 1) * tier.rewardMultiplier;
      await updateProgress(
        userId,
        {
          achievementMultiplier: Number(newMultiplier.toFixed(6)),
        },
        client
      );

      const cosmeticRewards = ACHIEVEMENT_COSMETIC_REWARDS[definition.slug] ?? [];
      const cosmeticForTier = cosmeticRewards.find(reward => reward.tier === nextTier);
      if (cosmeticForTier) {
        const alreadyOwned = await hasUserCosmetic(userId, cosmeticForTier.cosmeticId, client);
        if (!alreadyOwned) {
          await addUserCosmetic(userId, cosmeticForTier.cosmeticId, client);
          await logEvent(
            userId,
            'achievement_cosmetic_granted',
            {
              achievement_slug: definition.slug,
              tier: nextTier,
              cosmetic_id: cosmeticForTier.cosmeticId,
            },
            { client }
          );
          recordAchievementCosmeticMetric(cosmeticForTier.cosmeticId);
          recordCosmeticGrantedMetric({
            cosmeticId: cosmeticForTier.cosmeticId,
            source: 'reward',
          });
        }
      }

      await logEvent(
        userId,
        'achievement_claimed',
        {
          achievement_slug: definition.slug,
          tier: nextTier,
          reward_multiplier: tier.rewardMultiplier,
          new_achievement_multiplier: newMultiplier,
        },
        { client }
      );
      recordAchievementClaimedMetric(definition.slug, nextTier);

      return {
        definition,
        tier,
        progress: updatedProgress,
        newAchievementMultiplier: newMultiplier,
      };
    });

    await invalidateProfileCache(userId);

    return {
      slug,
      tier: result.tier.tier,
      rewardMultiplier: result.tier.rewardMultiplier,
      newAchievementMultiplier: result.newAchievementMultiplier,
    };
  }
}

export const achievementService = new AchievementService();
