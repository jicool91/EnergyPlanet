import { transaction } from '../db/connection';
import { contentService, type QuestDefinition } from './ContentService';
import {
  listQuestProgress,
  upsertQuestProgress,
  updateQuestStatus,
  getQuestProgress,
  type QuestProgressRecord,
} from '../repositories/QuestRepository';
import { loadPlayerContext } from './playerContext';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { adjustStarsBalance } from '../repositories/ProgressRepository';
import { updateProgress } from '../repositories/ProgressRepository';
import { logEvent } from '../repositories/EventRepository';

interface QuestReward {
  stars: number;
  energy: number;
  xp: number;
}

interface QuestView extends QuestReward {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly';
  target: number;
  progress: number;
  baseline: number;
  expiresAt: string;
  status: 'active' | 'ready' | 'claimed';
}

const METRIC_KEYS = {
  taps: 'totalTaps',
  energy: 'totalEnergyProduced',
  buildings: 'totalBuildingsPurchased',
  prestige_energy: 'prestigeEnergySinceReset',
} as const;

type MetricKey = keyof typeof METRIC_KEYS;

function computeExpiry(type: 'daily' | 'weekly', now: Date): Date {
  if (type === 'weekly') {
    const expires = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const dayOfWeek = expires.getUTCDay();
    const daysUntilMonday = (8 - dayOfWeek) % 7 || 7; // next Monday 00:00 UTC
    expires.setUTCDate(expires.getUTCDate() + daysUntilMonday);
    return expires;
  }
  const expires = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return expires;
}

function resolveMetric(def: QuestDefinition, context: Awaited<ReturnType<typeof loadPlayerContext>>): number {
  const metric = def.metric as MetricKey;
  switch (metric) {
    case 'taps':
      return context.progress.totalTaps ?? 0;
    case 'energy':
      return Math.floor(context.progress.totalEnergyProduced ?? 0);
    case 'buildings':
      return context.progress.totalBuildingsPurchased ?? 0;
    case 'prestige_energy':
      return Math.max(
        0,
        Math.floor(
          (context.progress.totalEnergyProduced ?? 0) -
            (context.progress.prestigeEnergySnapshot ?? 0)
        )
      );
    default:
      logger.warn('QuestService: unknown metric, defaulting to zero', { metric });
      return 0;
  }
}

function buildReward(def: QuestDefinition): QuestReward {
  return {
    stars: def.reward?.stars ?? 0,
    energy: def.reward?.energy ?? 0,
    xp: def.reward?.xp ?? 0,
  };
}

class QuestService {
  async list(userId: string): Promise<QuestView[]> {
    const quests = await transaction(async client => {
      const context = await loadPlayerContext(userId, client);
      const definitions = contentService.getQuestDefinitions();
      const existing = await listQuestProgress(userId, client);
      const existingMap = new Map(existing.map(record => [record.questId, record]));
      const now = new Date();
      const results: QuestProgressRecord[] = [];

      for (const definition of definitions) {
        const record = existingMap.get(definition.id) ?? null;
        const metricValue = resolveMetric(definition, context);

        const shouldReset =
          !record ||
          record.expiresAt.getTime() <= now.getTime();

        const baseline = shouldReset ? metricValue : record.baselineValue;
        const expiresAt = shouldReset ? computeExpiry(definition.type, now) : record.expiresAt;
        const progressValue = Math.max(0, metricValue - baseline);
        const reward = buildReward(definition);
        const status: 'active' | 'ready' | 'claimed' = record?.status === 'claimed'
          ? 'claimed'
          : progressValue >= definition.target
            ? 'ready'
            : 'active';

        const upserted = await upsertQuestProgress(
          userId,
          {
            questId: definition.id,
            questType: definition.type,
            baselineValue: baseline,
            progressValue,
            targetValue: definition.target,
            rewardStars: reward.stars,
            rewardEnergy: reward.energy,
            rewardXp: reward.xp,
            status,
            expiresAt,
            metadata: {
              title: definition.title,
              description: definition.description ?? '',
            },
          },
          client
        );

        results.push(upserted);
      }

      return results;
    });

    return quests.map(record => this.toView(record));
  }

  async claim(userId: string, questId: string): Promise<QuestView> {
    return transaction(async client => {
      const record = await getQuestProgress(userId, questId, client);
      if (!record) {
        throw new AppError(404, 'quest_not_found');
      }
      if (record.status !== 'ready') {
        throw new AppError(409, 'quest_not_ready');
      }

      const definitions = contentService.getQuestDefinitions();
      const definition = definitions.find(def => def.id === questId);
      if (!definition) {
        throw new AppError(404, 'quest_definition_missing');
      }

      const reward = buildReward(definition);
      const context = await loadPlayerContext(userId, client);
      const newEnergy = context.progress.energy + reward.energy;
      const newXp = context.progress.xp + reward.xp;

      if (reward.stars > 0) {
        await adjustStarsBalance(userId, reward.stars, client);
      }

      if (reward.energy > 0 || reward.xp > 0) {
        await updateProgress(
          userId,
          {
            energy: newEnergy,
            xp: newXp,
          },
          client
        );
      }

      const updated = await updateQuestStatus(userId, questId, 'claimed', client);
      if (!updated) {
        throw new AppError(404, 'quest_not_found');
      }

      await logEvent(
        userId,
        'quest_claimed',
        {
          quest_id: questId,
          quest_type: definition.type,
          reward_stars: reward.stars,
          reward_energy: reward.energy,
          reward_xp: reward.xp,
        },
        { client }
      );

      logger.info('Quest reward granted', {
        userId,
        questId,
        reward,
      });

      return this.toView(updated);
    });
  }

  private toView(record: QuestProgressRecord): QuestView {
    const definitions = contentService.getQuestDefinitions();
    const definition = definitions.find(def => def.id === record.questId);

    return {
      id: record.questId,
      title: definition?.title ?? record.questId,
      description: definition?.description ?? (record.metadata?.description as string | undefined),
      type: (definition?.type ?? record.questType) as 'daily' | 'weekly',
      target: record.targetValue,
      progress: Math.min(record.progressValue, record.targetValue),
      baseline: record.baselineValue,
      expiresAt: record.expiresAt.toISOString(),
      status: record.status,
      stars: record.rewardStars,
      energy: record.rewardEnergy,
      xp: record.rewardXp,
    };
  }
}

export const questService = new QuestService();
export type { QuestView };
