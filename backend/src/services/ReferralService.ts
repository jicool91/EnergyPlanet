import { PoolClient } from 'pg';
import crypto from 'crypto';
import { transaction } from '../db/connection';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import {
  contentService,
  ReferralConfig,
  ReferralEventConfig,
  ReferralMilestoneConfig,
  ReferralRewardConfig,
} from './ContentService';
import {
  createReferralCode,
  createReferralRelation,
  countReferralRelationsSince,
  countReferralRewardsSince,
  getReferralCodeByCode,
  getReferralCodeByUser,
  getReferralRelationByReferred,
  insertReferralEvent,
  insertReferralReward,
  listReferralRelations,
  listReferralRewards,
  hasReferralReward,
} from '../repositories/ReferralRepository';
import { adjustStarsBalance } from '../repositories/ProgressRepository';
import { addUserCosmetic } from '../repositories/UserCosmeticsRepository';
import { logEvent } from '../repositories/EventRepository';
import { findById } from '../repositories/UserRepository';
import { invalidateProfileCache } from '../cache/invalidation';
import {
  recordCosmeticGrantedMetric,
  recordReferralActivationMetric,
  recordReferralCodeMetric,
  recordReferralRewardMetric,
} from '../metrics/gameplay';
import { recordStarsCreditMetric } from '../metrics/business';

const hasDatabaseErrorCode = (error: unknown, code: string): boolean => {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === code;
};

export interface ReferralRewardView {
  stars: number;
  effectiveStars: number;
  cosmeticId?: string | null;
  title?: string;
  description?: string;
  multiplier: number;
}

export interface ReferralMilestoneView {
  id: string;
  title: string;
  description?: string;
  threshold: number;
  claimed: boolean;
  claimable: boolean;
  progress: {
    current: number;
    remaining: number;
    percentage: number;
  };
  reward: ReferralRewardView;
}

export interface ReferralEventView {
  id: string;
  label: string;
  description?: string;
  start: string;
  end: string;
  inviteeRewardMultiplier?: number;
  referrerRewardMultiplier?: number;
  milestoneRewardMultiplier?: number;
}

export interface ReferralSummary {
  code: string;
  shareUrl: string | null;
  inviteeReward: ReferralRewardView;
  referrerReward: ReferralRewardView;
  totalActivations: number;
  dailyActivations: {
    used: number;
    limit: number;
  };
  milestones: ReferralMilestoneView[];
  activeEvents: ReferralEventView[];
  stats: {
    totalRewardsClaimed: number;
    dailyRewardsUsed: number;
    dailyRewardLimit: number;
  };
  referredBy?: {
    userId: string;
    username: string | null;
    firstName: string | null;
  } | null;
  lastUpdated: string;
}

interface GrantedReward {
  starsGranted: number;
  cosmeticGranted?: string | null;
  multiplier: number;
}

class ReferralService {
  async getSummary(userId: string): Promise<ReferralSummary> {
    const config = this.getConfigStrict();
    return transaction(async client => {
      await this.ensureReferralCode(userId, client);
      return this.buildSummary(userId, config, client);
    });
  }

  async activateCode(userId: string, code: string): Promise<ReferralSummary> {
    const trimmedCode = code?.trim();
    if (!trimmedCode) {
      throw new AppError(400, 'referral_code_required');
    }

    const config = this.getConfigStrict();
    return transaction(async client => {
      const normalizedCode = trimmedCode.toUpperCase();
      const codeRecord = await getReferralCodeByCode(normalizedCode, client);
      if (!codeRecord) {
        throw new AppError(404, 'referral_code_not_found');
      }

      if (codeRecord.userId === userId) {
        throw new AppError(409, 'referral_self_not_allowed');
      }

      const existingRelation = await getReferralRelationByReferred(userId, client);
      if (existingRelation) {
        throw new AppError(409, 'referral_already_activated');
      }

      await this.ensureReferralCode(codeRecord.userId, client);

      const startOfDay = this.getStartOfUtcDay(new Date());
      const dailyActivations = await countReferralRelationsSince(
        codeRecord.userId,
        startOfDay,
        client
      );
      if (config.limits.dailyActivations > 0 && dailyActivations >= config.limits.dailyActivations) {
        throw new AppError(429, 'referral_referrer_daily_limit');
      }

      await createReferralRelation(codeRecord.userId, userId, { code: normalizedCode }, client);

      const activeEvents = this.getActiveEvents(config, new Date());
      const inviteeRewardResult = await this.applyRewardToUser(
        userId,
        config.inviteeReward,
        activeEvents,
        'invitee',
        client
      );

      const referrerRewardResult = await this.applyRewardToUser(
        codeRecord.userId,
        config.referrerReward,
        activeEvents,
        'referrer',
        client
      );

      await insertReferralEvent(
        userId,
        'referral_activation',
        {
          code: normalizedCode,
          referrer_id: codeRecord.userId,
          invitee_reward: inviteeRewardResult,
        },
        client
      );

      await insertReferralEvent(
        codeRecord.userId,
        'referral_activation_referrer',
        {
          referred_id: userId,
          referrer_reward: referrerRewardResult,
        },
        client
      );

      await logEvent(
        userId,
        'referral_activation',
        {
          code: normalizedCode,
          referrer_id: codeRecord.userId,
          stars_awarded: inviteeRewardResult.starsGranted,
        },
        { client }
      );

      await logEvent(
        codeRecord.userId,
        'referral_invite_reward',
        {
          referred_id: userId,
          stars_awarded: referrerRewardResult.starsGranted,
        },
        { client }
      );

      await invalidateProfileCache(userId);
      await invalidateProfileCache(codeRecord.userId);

      recordReferralActivationMetric();
      recordReferralRewardMetric({
        type: 'invitee',
        stars: inviteeRewardResult.starsGranted,
        cosmeticGranted: Boolean(inviteeRewardResult.cosmeticGranted),
      });
      recordReferralRewardMetric({
        type: 'referrer',
        stars: referrerRewardResult.starsGranted,
        cosmeticGranted: Boolean(referrerRewardResult.cosmeticGranted),
      });

      return this.buildSummary(userId, config, client);
    });
  }

  async claimMilestone(userId: string, milestoneId: string): Promise<ReferralSummary> {
    const config = this.getConfigStrict();
    const milestone = config.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new AppError(404, 'referral_milestone_not_found');
    }

    return transaction(async client => {
      await this.ensureReferralCode(userId, client);

      const relations = await listReferralRelations(userId, client);
      const totalActivations = relations.length;
      if (totalActivations < milestone.threshold) {
        throw new AppError(409, 'referral_milestone_not_ready');
      }

      const alreadyClaimed = await hasReferralReward(userId, milestone.id, client);
      if (alreadyClaimed) {
        throw new AppError(409, 'referral_milestone_already_claimed');
      }

      const startOfDay = this.getStartOfUtcDay(new Date());
      const dailyRewardsClaimed = await countReferralRewardsSince(userId, startOfDay, client);
      if (config.limits.dailyRewardClaims > 0 && dailyRewardsClaimed >= config.limits.dailyRewardClaims) {
        throw new AppError(429, 'referral_daily_reward_limit');
      }

      const activeEvents = this.getActiveEvents(config, new Date());
      const rewardResult = await this.applyRewardToUser(
        userId,
        milestone.rewards,
        activeEvents,
        'milestone',
        client
      );

      await insertReferralReward(
        userId,
        milestone.id,
        {
          milestone_id: milestone.id,
          threshold: milestone.threshold,
          reward: milestone.rewards,
          multiplier: rewardResult.multiplier,
        },
        client
      );

      await insertReferralEvent(
        userId,
        'referral_milestone_claimed',
        {
          milestone_id: milestone.id,
          threshold: milestone.threshold,
          stars_awarded: rewardResult.starsGranted,
        },
        client
      );

      await logEvent(
        userId,
        'referral_reward_granted',
        {
          milestone_id: milestone.id,
          stars_awarded: rewardResult.starsGranted,
        },
        { client }
      );

      recordReferralRewardMetric({
        type: 'milestone',
        stars: rewardResult.starsGranted,
        cosmeticGranted: Boolean(rewardResult.cosmeticGranted),
      });

      await invalidateProfileCache(userId);

      return this.buildSummary(userId, config, client);
    });
  }

  private getConfigStrict(): ReferralConfig {
    const configValue = contentService.getReferralConfig();
    if (!configValue) {
      throw new AppError(503, 'referral_config_missing');
    }
    return configValue;
  }

  private getActiveEvents(config: ReferralConfig, now: Date): ReferralEventConfig[] {
    if (!config.events || config.events.length === 0) {
      return [];
    }

    return config.events.filter(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return now >= start && now <= end;
    });
  }

  private getStartOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private async ensureReferralCode(userId: string, client: PoolClient): Promise<void> {
    const existing = await getReferralCodeByUser(userId, client);
    if (existing) {
      return;
    }

    let attempts = 0;
    while (attempts < 5) {
      attempts += 1;
      const candidate = this.generateHumanReadableCode();
      try {
        const created = await createReferralCode(userId, candidate, client);
        await insertReferralEvent(
          userId,
          'referral_code_generated',
          { code: created.code },
          client
        );
        await logEvent(
          userId,
          'referral_code_created',
          { code: created.code },
          { client }
        );
        recordReferralCodeMetric();
        return;
      } catch (error: unknown) {
        if (hasDatabaseErrorCode(error, '23505')) {
          logger.warn({ userId, attempt: attempts }, 'referral_code_collision_retry');
          continue;
        }
        throw error;
      }
    }

    logger.error({ userId }, 'referral_code_generation_exhausted');
    throw new AppError(500, 'referral_code_generation_failed');
  }

  private generateHumanReadableCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(4);
    let code = '';
    for (let i = 0; i < bytes.length; i += 1) {
      code += alphabet[bytes[i] % alphabet.length];
    }
    return `EP-${code}`;
  }

  private calculateMultiplier(
    events: ReferralEventConfig[],
    type: 'invitee' | 'referrer' | 'milestone'
  ): number {
    if (events.length === 0) {
      return 1;
    }

    return events.reduce((acc, event) => {
      const key =
        type === 'invitee'
          ? event.inviteeRewardMultiplier
          : type === 'referrer'
            ? event.referrerRewardMultiplier
            : event.milestoneRewardMultiplier;
      if (!key || key <= 0) {
        return acc;
      }
      return acc * key;
    }, 1);
  }

  private async applyRewardToUser(
    userId: string,
    reward: ReferralRewardConfig,
    events: ReferralEventConfig[],
    type: 'invitee' | 'referrer' | 'milestone',
    client: PoolClient
  ): Promise<GrantedReward> {
    const multiplier = this.calculateMultiplier(events, type);
    const baseStars = reward.stars ?? 0;
    const effectiveStars = Math.round(baseStars * multiplier);
    let starsGranted = 0;

    if (effectiveStars > 0) {
      await adjustStarsBalance(userId, effectiveStars, client);
      starsGranted = effectiveStars;
      recordStarsCreditMetric(`referral_${type}`, effectiveStars);
    }

    if (reward.cosmeticId) {
      await addUserCosmetic(userId, reward.cosmeticId, client);
      recordCosmeticGrantedMetric({
        cosmeticId: reward.cosmeticId,
        source: 'reward',
      });
    }

    return {
      starsGranted,
      cosmeticGranted: reward.cosmeticId,
      multiplier,
    };
  }

  private async buildSummary(
    userId: string,
    config: ReferralConfig,
    client: PoolClient
  ): Promise<ReferralSummary> {
    const codeRecord = await getReferralCodeByUser(userId, client);
    if (!codeRecord) {
      throw new AppError(500, 'referral_code_missing');
    }

    const relations = await listReferralRelations(userId, client);
    const totalActivations = relations.length;
    const startOfDay = this.getStartOfUtcDay(new Date());
    const dailyActivations = await countReferralRelationsSince(userId, startOfDay, client);
    const claimedRewards = await listReferralRewards(userId, client);
    const dailyRewardsUsed = await countReferralRewardsSince(userId, startOfDay, client);

    const activeEvents = this.getActiveEvents(config, new Date());

    const inviteeRewardView = this.toRewardView(
      config.inviteeReward,
      activeEvents,
      'invitee'
    );
    const referrerRewardView = this.toRewardView(
      config.referrerReward,
      activeEvents,
      'referrer'
    );

    const claimedMilestones = new Set(claimedRewards.map(reward => reward.milestoneId));

    const milestones = config.milestones.map(milestone =>
      this.toMilestoneView(
        milestone,
        totalActivations,
        claimedMilestones.has(milestone.id),
        activeEvents
      )
    );

    const relationAsInvitee = await getReferralRelationByReferred(userId, client);
    let referredBy: ReferralSummary['referredBy'] = null;
    if (relationAsInvitee) {
      const user = await findById(relationAsInvitee.referrerId, client);
      referredBy = user
        ? {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
          }
        : null;
    }

    return {
      code: codeRecord.code,
      shareUrl: this.buildShareUrl(codeRecord.code, config),
      inviteeReward: inviteeRewardView,
      referrerReward: referrerRewardView,
      totalActivations,
      dailyActivations: {
        used: dailyActivations,
        limit: config.limits.dailyActivations,
      },
      milestones,
      activeEvents: activeEvents.map(event => ({
        id: event.id,
        label: event.label,
        description: event.description,
        start: event.start,
        end: event.end,
        inviteeRewardMultiplier: event.inviteeRewardMultiplier,
        referrerRewardMultiplier: event.referrerRewardMultiplier,
        milestoneRewardMultiplier: event.milestoneRewardMultiplier,
      })),
      stats: {
        totalRewardsClaimed: claimedRewards.length,
        dailyRewardsUsed,
        dailyRewardLimit: config.limits.dailyRewardClaims,
      },
      referredBy,
      lastUpdated: new Date().toISOString(),
    };
  }

  private toRewardView(
    reward: ReferralRewardConfig,
    events: ReferralEventConfig[],
    type: 'invitee' | 'referrer' | 'milestone'
  ): ReferralRewardView {
    const multiplier = this.calculateMultiplier(events, type);
    const baseStars = reward.stars ?? 0;
    const effectiveStars = Math.round(baseStars * multiplier);
    return {
      stars: baseStars,
      effectiveStars,
      cosmeticId: reward.cosmeticId,
      title: reward.title,
      description: reward.description,
      multiplier,
    };
  }

  private toMilestoneView(
    milestone: ReferralMilestoneConfig,
    totalActivations: number,
    claimed: boolean,
    events: ReferralEventConfig[]
  ): ReferralMilestoneView {
    const rewardView = this.toRewardView(milestone.rewards, events, 'milestone');
    const current = totalActivations;
    const remaining = Math.max(0, milestone.threshold - current);
    const percentage = Math.min(1, current / milestone.threshold) * 100;

    return {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      threshold: milestone.threshold,
      claimed,
      claimable: !claimed && totalActivations >= milestone.threshold,
      progress: {
        current,
        remaining,
        percentage: Number.isFinite(percentage) ? Math.round(percentage * 10) / 10 : 0,
      },
      reward: rewardView,
    };
  }

  private buildShareUrl(code: string, referralContent: ReferralConfig): string | null {
    const miniAppUrl = config.telegram.miniAppUrl;
    const botUsername = config.telegram.botUsername;

    let targetLink: string | null = null;
    if (miniAppUrl) {
      targetLink = `${miniAppUrl}${miniAppUrl.includes('?') ? '&' : '?'}startapp=ref_${encodeURIComponent(code)}`;
    } else if (botUsername) {
      targetLink = `https://t.me/${botUsername}?start=ref_${encodeURIComponent(code)}`;
    }

    const headline = referralContent.share?.headline ?? 'Присоединяйся в Energy Planet!';
    const message = referralContent.share?.message ?? '';
    const textParts = [headline.trim(), message.trim(), `Мой код: ${code}`.trim()].filter(Boolean);
    const shareText = textParts.join('\n');

    if (!targetLink) {
      if (!shareText) {
        return null;
      }
      return `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;
    }

    return `https://t.me/share/url?url=${encodeURIComponent(targetLink)}&text=${encodeURIComponent(shareText)}`;
  }
}

export const referralService = new ReferralService();
