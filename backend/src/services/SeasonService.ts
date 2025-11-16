/**
 * Season Service
 * Manages season progression, leaderboards, and rewards
 */

import { PoolClient } from 'pg';
import { contentService, Season } from './ContentService';
import * as SeasonRepository from '../repositories/SeasonRepository';
import * as ProgressRepository from '../repositories/ProgressRepository';
import { logger } from '../utils/logger';

export interface SeasonRewardInfo {
  rewardType: string;
  rewardTier: string | null;
  finalRank: number | null;
  rewards: Record<string, unknown>;
  claimed: boolean;
  claimedAt: string | null;
}

export interface BattlePassRewardInfo {
  type: string;
  amount?: number;
  itemId?: string;
}

export interface BattlePassTierInfo {
  tier: number;
  requiredXp: number;
  freeRewards: BattlePassRewardInfo[];
  premiumRewards: BattlePassRewardInfo[];
  freeClaimed: boolean;
  premiumClaimed: boolean;
  freeClaimable: boolean;
  premiumClaimable: boolean;
}

export interface BattlePassProgressInfo {
  enabled: boolean;
  premiumPurchased: boolean;
  premiumPriceStars: number;
  totalTiers: number;
  xpPerTier: number;
  currentTier: number;
  xpIntoCurrentTier: number;
  xpToNextTier: number | null;
  nextTierXp: number | null;
  tiers: BattlePassTierInfo[];
}

export interface SeasonEventInfo {
  eventId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participated: boolean;
  rewardClaimed: boolean;
  rewards?: Array<{
    type: string;
    amount?: number;
    condition?: string;
  }>;
  multipliers?: {
    passive_income?: number;
    building_cost?: number;
    xp_gain?: number;
  };
}

export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  firstName: string | null;
  rank: number;
  seasonEnergyProduced: number;
  seasonXp: number;
}

export interface SeasonProgressResponse {
  seasonId: string;
  seasonName: string;
  seasonNumber: number;
  seasonXp: number;
  seasonEnergyProduced: number;
  leaderboardRank: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  rewards: SeasonRewardInfo[];
  events: SeasonEventInfo[];
  battlePass: BattlePassProgressInfo | null;
}

export class SeasonService {
  /**
   * Get current active season from content
   */
  getCurrentSeason(): Season | null {
    return contentService.getSeason();
  }

  /**
   * Check if current season is active based on dates
   */
  isSeasonActive(season: Season): boolean {
    const now = new Date();

    if (!season.season.dates) {
      return true; // No dates defined, assume always active
    }

    const startDate = new Date(season.season.dates.start);
    const endDate = new Date(season.season.dates.end);

    return now >= startDate && now <= endDate;
  }

  /**
   * Get player's season progress
   */
  async getSeasonProgress(
    userId: string,
    client?: PoolClient
  ): Promise<SeasonProgressResponse | null> {
    const season = this.getCurrentSeason();

    if (!season) {
      logger.warn({ userId }, 'season_not_found');
      return null;
    }

    const seasonId = season.season.id;
    const isActive = this.isSeasonActive(season);

    // Get or create season progress
    let progress = await SeasonRepository.getSeasonProgress(userId, seasonId, client);

    if (!progress) {
      // Initialize season progress for new player
      progress = await SeasonRepository.upsertSeasonProgress(
        userId,
        seasonId,
        { seasonXp: 0, seasonEnergyProduced: 0 },
        client
      );
    }

    // Get season rewards
    const rewardRecords = await SeasonRepository.getSeasonRewards(userId, seasonId, client);
    const seasonPass = await SeasonRepository.getSeasonPass(userId, seasonId, client);
    const rewards: SeasonRewardInfo[] = rewardRecords.map(r => ({
      rewardType: r.rewardType,
      rewardTier: r.rewardTier,
      finalRank: r.finalRank,
      rewards: r.rewardPayload,
      claimed: r.claimed,
      claimedAt: r.claimedAt?.toISOString() ?? null,
    }));

    // Get season events info
    const events: SeasonEventInfo[] = await this.getSeasonEvents(userId, season, client);
    const battlePass = this.buildBattlePassProgress(season, progress, rewardRecords, seasonPass);

    return {
      seasonId: season.season.id,
      seasonName: season.season.name,
      seasonNumber: season.season.number,
      seasonXp: progress.seasonXp,
      seasonEnergyProduced: progress.seasonEnergyProduced,
      leaderboardRank: progress.leaderboardRank,
      startDate: season.season.dates?.start ?? null,
      endDate: season.season.dates?.end ?? null,
      isActive,
      rewards,
      events,
      battlePass,
    };
  }

  /**
   * Get season events with participation status
   */
  private async getSeasonEvents(
    userId: string,
    season: Season,
    client?: PoolClient
  ): Promise<SeasonEventInfo[]> {
    const seasonId = season.season.id;
    const seasonEvents = season.season.events ?? [];
    const now = new Date();

    const events: SeasonEventInfo[] = [];

    for (const event of seasonEvents) {
      const eventRecord = await SeasonRepository.getSeasonEvent(userId, seasonId, event.id, client);

      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const isActive = now >= startDate && now <= endDate;

      events.push({
        eventId: event.id,
        name: event.name,
        description: event.description,
        startDate: event.start,
        endDate: event.end,
        isActive,
        participated: eventRecord?.participated ?? false,
        rewardClaimed: eventRecord?.rewardClaimed ?? false,
        rewards: event.rewards,
        multipliers: event.multipliers,
      });
    }

    return events;
  }

  private buildBattlePassProgress(
    season: Season,
    progress: SeasonRepository.SeasonProgressRecord,
    rewardRecords: SeasonRepository.SeasonRewardRecord[],
    seasonPass: SeasonRepository.SeasonPassRecord | null
  ): BattlePassProgressInfo | null {
    const battlePassConfig = season.season.battle_pass;
    if (!battlePassConfig || !battlePassConfig.enabled) {
      return null;
    }

    const tiersFromContent = battlePassConfig.tiers ?? [];
    const totalTiers = Math.max(
      battlePassConfig.max_tiers ?? tiersFromContent.length,
      tiersFromContent.length
    );

    if (totalTiers <= 0) {
      return null;
    }

    const xpPerTier = Math.max(1, battlePassConfig.xp_per_tier ?? 5000);
    const premiumPriceStars = Math.max(0, battlePassConfig.premium_price_stars ?? 0);
    const premiumPurchased = Boolean(seasonPass?.isPremium);

    const tierMap = new Map<number, (typeof tiersFromContent)[number]>();
    for (const tierDef of tiersFromContent) {
      if (typeof tierDef?.tier === 'number' && tierDef.tier > 0) {
        tierMap.set(tierDef.tier, tierDef);
      }
    }

    const claimedRewardTypes = new Set(
      rewardRecords
        .filter(record => record.rewardType.startsWith('battle_pass_'))
        .map(record => record.rewardType)
    );

    const tiers: BattlePassTierInfo[] = [];
    for (let tier = 1; tier <= totalTiers; tier += 1) {
      const tierConfig = tierMap.get(tier);
      const requiredXp = Math.max(0, xpPerTier * (tier - 1));
      const freeRewards = this.normalizeBattlePassRewards(tierConfig?.free_rewards);
      const premiumRewards = this.normalizeBattlePassRewards(tierConfig?.premium_rewards);
      const hasProgress = progress.seasonXp >= requiredXp;
      const freeKey = this.getBattlePassRewardKey(tier, 'free');
      const premiumKey = this.getBattlePassRewardKey(tier, 'premium');
      const freeClaimed = claimedRewardTypes.has(freeKey);
      const premiumClaimed = claimedRewardTypes.has(premiumKey);

      tiers.push({
        tier,
        requiredXp,
        freeRewards,
        premiumRewards,
        freeClaimed,
        premiumClaimed,
        freeClaimable: hasProgress && freeRewards.length > 0 && !freeClaimed,
        premiumClaimable:
          hasProgress &&
          premiumRewards.length > 0 &&
          premiumPurchased &&
          !premiumClaimed,
      });
    }

    const currentTier = Math.min(totalTiers, Math.floor(progress.seasonXp / xpPerTier) + 1);
    const xpIntoCurrentTier = progress.seasonXp - xpPerTier * (currentTier - 1);
    const xpToNextTier = currentTier >= totalTiers ? null : Math.max(0, xpPerTier - xpIntoCurrentTier);
    const nextTierXp = currentTier >= totalTiers ? null : xpPerTier * currentTier;

    return {
      enabled: true,
      premiumPurchased,
      premiumPriceStars,
      totalTiers,
      xpPerTier,
      currentTier,
      xpIntoCurrentTier,
      xpToNextTier,
      nextTierXp,
      tiers,
    };
  }

  /**
   * Record XP gained during season
   */
  async recordSeasonXp(
    userId: string,
    xpAmount: number,
    client?: PoolClient
  ): Promise<void> {
    const season = this.getCurrentSeason();

    if (!season || !this.isSeasonActive(season)) {
      return; // No active season, skip
    }

    await SeasonRepository.incrementSeasonXp(userId, season.season.id, xpAmount, client);

    logger.debug({ userId, seasonId: season.season.id, xpAmount }, 'season_xp_recorded');
  }

  /**
   * Record energy produced during season
   */
  async recordSeasonEnergy(
    userId: string,
    energyAmount: number,
    client?: PoolClient
  ): Promise<void> {
    const season = this.getCurrentSeason();

    if (!season || !this.isSeasonActive(season)) {
      return; // No active season, skip
    }

    await SeasonRepository.incrementSeasonEnergy(userId, season.season.id, energyAmount, client);

    logger.debug({ userId, seasonId: season.season.id, energyAmount }, 'season_energy_recorded');
  }

  /**
   * Get season leaderboard
   */
  async getSeasonLeaderboard(
    limit: number = 100,
    client?: PoolClient
  ): Promise<LeaderboardEntry[]> {
    const season = this.getCurrentSeason();

    if (!season) {
      return [];
    }

    const leaderboard = await SeasonRepository.getSeasonLeaderboard(
      season.season.id,
      limit,
      client
    );

    return leaderboard.map((entry, index) => ({
      userId: entry.userId,
      username: entry.username,
      firstName: entry.firstName,
      rank: index + 1,
      seasonEnergyProduced: entry.seasonEnergyProduced,
      seasonXp: entry.seasonXp,
    }));
  }

  /**
   * Update leaderboard ranks (should be run periodically)
   */
  async updateLeaderboardRanks(client?: PoolClient): Promise<void> {
    const season = this.getCurrentSeason();

    if (!season) {
      return;
    }

    const leaderboard = await SeasonRepository.getSeasonLeaderboard(
      season.season.id,
      1000,
      client
    );

    // Update ranks in parallel
    const updatePromises = leaderboard.map((entry, index) => {
      const rank = index + 1;
      return SeasonRepository.upsertSeasonProgress(
        entry.userId,
        season.season.id,
        { leaderboardRank: rank },
        client
      );
    });

    await Promise.all(updatePromises);

    logger.info(
      { seasonId: season.season.id, updatedCount: leaderboard.length },
      'season_leaderboard_ranks_updated'
    );
  }

  async distributeLeaderboardRewards(options?: {
    force?: boolean;
  }): Promise<{ seasonId: string | null; distributed: number; skipped: boolean; reason?: string }> {
    const season = this.getCurrentSeason();

    if (!season) {
      return { seasonId: null, distributed: 0, skipped: true, reason: 'season_not_found' };
    }

    if (this.isSeasonActive(season) && !options?.force) {
      return { seasonId: season.season.id, distributed: 0, skipped: true, reason: 'season_active' };
    }

    const maxRank = this.getMaxLeaderboardRewardRank(season);
    if (maxRank <= 0) {
      return { seasonId: season.season.id, distributed: 0, skipped: true, reason: 'no_rewards_configured' };
    }

    const leaderboard = await SeasonRepository.getSeasonLeaderboard(season.season.id, maxRank);
    if (leaderboard.length === 0) {
      return { seasonId: season.season.id, distributed: 0, skipped: true, reason: 'no_leaderboard_entries' };
    }

    let distributed = 0;

    for (let i = 0; i < leaderboard.length; i += 1) {
      const entry = leaderboard[i];
      const rank = i + 1;
      const rewardConfig = this.findLeaderboardReward(season, rank);

      if (!rewardConfig) {
        continue;
      }

      const existingReward = await SeasonRepository.getSeasonRewardByType(
        entry.userId,
        season.season.id,
        'leaderboard'
      );

      if (existingReward?.claimed) {
        continue;
      }

      const rewardTier = this.getRewardTier(rank);
      const rewardPayload = this.buildRewardPayload(rewardConfig.rewards);

      await SeasonRepository.createSeasonReward(
        entry.userId,
        season.season.id,
        'leaderboard',
        rewardTier,
        rank,
        rewardPayload
      );

      const claimedReward = await SeasonRepository.claimSeasonReward(
        entry.userId,
        season.season.id,
        'leaderboard'
      );

      if (!claimedReward) {
        logger.warn({ userId: entry.userId, seasonId: season.season.id }, 'auto_claim_failed');
        continue;
      }

      await SeasonRepository.markLeaderboardRewardClaimed(entry.userId, season.season.id);
      await this.applyRewards(entry.userId, rewardPayload);
      distributed += 1;
    }

    logger.info({ seasonId: season.season.id, distributed }, 'season_leaderboard_auto_distributed');

    return { seasonId: season.season.id, distributed, skipped: false };
  }

  /**
   * Claim season leaderboard reward
   */
  async claimLeaderboardReward(
    userId: string,
    client?: PoolClient
  ): Promise<{ success: boolean; reward?: SeasonRewardInfo; error?: string }> {
    const season = this.getCurrentSeason();

    if (!season) {
      return { success: false, error: 'No active season' };
    }

    // Check if season has ended
    if (this.isSeasonActive(season)) {
      return { success: false, error: 'Season is still active' };
    }

    const seasonId = season.season.id;

    // Get player's final rank
    const progress = await SeasonRepository.getSeasonProgress(userId, seasonId, client);

    if (!progress || !progress.leaderboardRank) {
      return { success: false, error: 'Player not ranked' };
    }

    // Check if already claimed
    const existingRewards = await SeasonRepository.getSeasonRewards(userId, seasonId, client);
    const leaderboardReward = existingRewards.find(r => r.rewardType === 'leaderboard' && r.claimed);

    if (leaderboardReward) {
      return { success: false, error: 'Reward already claimed' };
    }

    // Find matching reward tier
    const rewardConfig = this.findLeaderboardReward(season, progress.leaderboardRank);

    if (!rewardConfig) {
      return { success: false, error: 'No reward for this rank' };
    }

    // Determine reward tier
    const rewardTier = this.getRewardTier(progress.leaderboardRank);

    // Create and claim reward
    const rewardPayload = this.buildRewardPayload(rewardConfig.rewards);

    await SeasonRepository.createSeasonReward(
      userId,
      seasonId,
      'leaderboard',
      rewardTier,
      progress.leaderboardRank,
      rewardPayload,
      client
    );

    const claimedReward = await SeasonRepository.claimSeasonReward(
      userId,
      seasonId,
      'leaderboard',
      client
    );

    if (!claimedReward) {
      return { success: false, error: 'Failed to claim reward' };
    }

    // Apply rewards to player account
    await this.applyRewards(userId, rewardPayload, client);
    await SeasonRepository.markLeaderboardRewardClaimed(userId, seasonId, client);

    logger.info(
      { userId, seasonId, rank: progress.leaderboardRank, rewardTier },
      'season_leaderboard_reward_claimed'
    );

    return {
      success: true,
      reward: {
        rewardType: claimedReward.rewardType,
        rewardTier: claimedReward.rewardTier,
        finalRank: claimedReward.finalRank,
        rewards: claimedReward.rewardPayload,
        claimed: claimedReward.claimed,
        claimedAt: claimedReward.claimedAt?.toISOString() ?? null,
      },
    };
  }

  /**
   * Participate in season event
   */
  async participateInEvent(
    userId: string,
    eventId: string,
    client?: PoolClient
  ): Promise<{ success: boolean; error?: string }> {
    const season = this.getCurrentSeason();

    if (!season || !this.isSeasonActive(season)) {
      return { success: false, error: 'No active season' };
    }

    const seasonId = season.season.id;
    const event = season.season.events?.find(e => e.id === eventId);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    // Check if event is active
    const now = new Date();
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    if (now < startDate || now > endDate) {
      return { success: false, error: 'Event not active' };
    }

    await SeasonRepository.markSeasonEventParticipated(userId, seasonId, eventId, client);

    logger.info({ userId, seasonId, eventId }, 'season_event_participated');

    return { success: true };
  }

  /**
   * Claim season event reward
   */
  async claimEventReward(
    userId: string,
    eventId: string,
    client?: PoolClient
  ): Promise<{ success: boolean; error?: string }> {
    const season = this.getCurrentSeason();

    if (!season) {
      return { success: false, error: 'No active season' };
    }

    const seasonId = season.season.id;
    const event = season.season.events?.find(e => e.id === eventId);

    if (!event || !event.rewards) {
      return { success: false, error: 'Event has no rewards' };
    }

    // Check participation
    const eventRecord = await SeasonRepository.getSeasonEvent(userId, seasonId, eventId, client);

    if (!eventRecord || !eventRecord.participated) {
      return { success: false, error: 'Not participated in event' };
    }

    if (eventRecord.rewardClaimed) {
      return { success: false, error: 'Reward already claimed' };
    }

    // Claim reward
    await SeasonRepository.claimSeasonEventReward(userId, seasonId, eventId, client);

    // Apply rewards
    const rewardPayload = this.buildRewardPayload(event.rewards);
    await this.applyRewards(userId, rewardPayload, client);

    logger.info({ userId, seasonId, eventId }, 'season_event_reward_claimed');

    return { success: true };
  }

  async purchaseBattlePass(
    userId: string,
    client?: PoolClient
  ): Promise<{ success: boolean; error?: string }> {
    const season = this.getCurrentSeason();

    if (!season || !this.isSeasonActive(season)) {
      return { success: false, error: 'No active season' };
    }

    const battlePassConfig = season.season.battle_pass;
    if (!battlePassConfig || !battlePassConfig.enabled) {
      return { success: false, error: 'Battle pass disabled' };
    }

    const seasonId = season.season.id;
    const existingPass = await SeasonRepository.getSeasonPass(userId, seasonId, client);
    if (existingPass?.isPremium) {
      return { success: false, error: 'already_unlocked' };
    }

    const priceStars = Math.max(0, battlePassConfig.premium_price_stars ?? 0);

    if (priceStars > 0) {
      try {
        await ProgressRepository.adjustStarsBalance(userId, -priceStars, client);
      } catch (error) {
        if (error instanceof Error && error.message === 'insufficient_stars') {
          return { success: false, error: 'insufficient_stars' };
        }
        throw error;
      }
    }

    await SeasonRepository.unlockSeasonPass(
      userId,
      seasonId,
      {
        priceStars,
        source: 'stars_balance',
        payload: {
          season_number: season.season.number,
        },
      },
      client
    );

    logger.info({ userId, seasonId, priceStars }, 'battle_pass_unlocked');
    return { success: true };
  }

  async claimBattlePassReward(
    userId: string,
    tier: number,
    track: 'free' | 'premium',
    client?: PoolClient
  ): Promise<{ success: boolean; error?: string; reward?: SeasonRewardInfo }> {
    if (!Number.isFinite(tier) || tier <= 0) {
      return { success: false, error: 'invalid_tier' };
    }

    const season = this.getCurrentSeason();
    if (!season) {
      return { success: false, error: 'No active season' };
    }

    const battlePassConfig = season.season.battle_pass;
    if (!battlePassConfig || !battlePassConfig.enabled) {
      return { success: false, error: 'Battle pass disabled' };
    }

    const xpPerTier = Math.max(1, battlePassConfig.xp_per_tier ?? 5000);
    const totalTiers = Math.max(
      battlePassConfig.max_tiers ?? (battlePassConfig.tiers ?? []).length,
      (battlePassConfig.tiers ?? []).length
    );

    if (tier > totalTiers) {
      return { success: false, error: 'tier_out_of_range' };
    }

    const seasonId = season.season.id;
    const progress = await SeasonRepository.getSeasonProgress(userId, seasonId, client);
    if (!progress) {
      return { success: false, error: 'season_progress_missing' };
    }

    const requiredXp = Math.max(0, xpPerTier * (tier - 1));
    if (progress.seasonXp < requiredXp) {
      return { success: false, error: 'tier_locked' };
    }

    const seasonPass = await SeasonRepository.getSeasonPass(userId, seasonId, client);
    if (track === 'premium' && !seasonPass?.isPremium) {
      return { success: false, error: 'premium_required' };
    }

    const tierConfig = (battlePassConfig.tiers ?? []).find(t => t.tier === tier);
    const rewardsDefinition =
      track === 'premium'
        ? tierConfig?.premium_rewards ?? []
        : tierConfig?.free_rewards ?? [];

    if (!rewardsDefinition || rewardsDefinition.length === 0) {
      return { success: false, error: 'no_rewards_defined' };
    }

    const rewardKey = this.getBattlePassRewardKey(tier, track);
    const existingReward = await SeasonRepository.getSeasonRewardByType(
      userId,
      seasonId,
      rewardKey,
      client
    );

    if (existingReward?.claimed) {
      return { success: false, error: 'reward_already_claimed' };
    }

    const rewardPayload = this.buildRewardPayload(
      rewardsDefinition.map(reward => ({
        type: reward.type,
        item_id: reward.item_id,
        amount: reward.amount,
      }))
    );

    await SeasonRepository.createSeasonReward(
      userId,
      seasonId,
      rewardKey,
      track,
      tier,
      rewardPayload,
      client
    );

    const claimedReward = await SeasonRepository.claimSeasonReward(userId, seasonId, rewardKey, client);

    if (!claimedReward) {
      return { success: false, error: 'claim_failed' };
    }

    await this.applyRewards(userId, rewardPayload, client);

    logger.info({ userId, seasonId, tier, track }, 'battle_pass_reward_claimed');

    return {
      success: true,
      reward: {
        rewardType: claimedReward.rewardType,
        rewardTier: claimedReward.rewardTier,
        finalRank: claimedReward.finalRank,
        rewards: claimedReward.rewardPayload,
        claimed: claimedReward.claimed,
        claimedAt: claimedReward.claimedAt?.toISOString() ?? null,
      },
    };
  }

  /**
   * Helper: Find leaderboard reward for a rank
   */
  private findLeaderboardReward(
    season: Season,
    rank: number
  ): { rewards: Array<{ type: string; item_id?: string; amount?: number }> } | null {
    const rewards = season.season.leaderboard_rewards ?? [];

    for (const rewardConfig of rewards) {
      if (rewardConfig.rank && rewardConfig.rank === rank) {
        return rewardConfig;
      }

      if (rewardConfig.rank_range) {
        const [min, max] = rewardConfig.rank_range;
        if (rank >= min && rank <= max) {
          return rewardConfig;
        }
      }
    }

    return null;
  }

  private getMaxLeaderboardRewardRank(season: Season): number {
    const rewards = season.season.leaderboard_rewards ?? [];
    return rewards.reduce((max, reward) => {
      if (typeof reward.rank === 'number') {
        return Math.max(max, reward.rank);
      }
      if (Array.isArray(reward.rank_range) && reward.rank_range.length === 2) {
        return Math.max(max, reward.rank_range[1] ?? 0);
      }
      return max;
    }, 0);
  }

  /**
   * Helper: Determine reward tier based on rank
   */
  private getRewardTier(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    if (rank <= 10) return 'top10';
    if (rank <= 50) return 'top50';
    if (rank <= 100) return 'top100';
    return 'participant';
  }

  /**
   * Helper: Build reward payload
   */
  private buildRewardPayload(
    rewards: Array<{ type: string; item_id?: string; amount?: number }>
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      cosmetics: [] as string[],
      energy: 0,
      stars: 0,
    };

    for (const reward of rewards) {
      if (reward.type === 'cosmetic' && reward.item_id) {
        (payload.cosmetics as string[]).push(reward.item_id);
      } else if (reward.type === 'energy' && reward.amount) {
        payload.energy = (payload.energy as number) + reward.amount;
      } else if (reward.type === 'stars' && reward.amount) {
        payload.stars = (payload.stars as number) + reward.amount;
      }
    }

    return payload;
  }

  private normalizeBattlePassRewards(
    rewards?: Array<{ type?: string; item_id?: string; amount?: number }>
  ): BattlePassRewardInfo[] {
    if (!Array.isArray(rewards) || rewards.length === 0) {
      return [];
    }

    return rewards
      .filter(reward => typeof reward?.type === 'string')
      .map(reward => ({
        type: reward.type as string,
        amount: reward.amount,
        itemId: reward.item_id,
      }));
  }

  private getBattlePassRewardKey(tier: number, track: 'free' | 'premium'): string {
    return `battle_pass_${track}_tier_${tier}`;
  }

  /**
   * Helper: Apply rewards to player account
   */
  private async applyRewards(
    userId: string,
    rewardPayload: Record<string, unknown>,
    client?: PoolClient
  ): Promise<void> {
    // Apply energy
    if (typeof rewardPayload.energy === 'number' && rewardPayload.energy > 0) {
      const progress = await ProgressRepository.getProgress(userId, client);
      if (progress) {
        await ProgressRepository.updateProgress(
          userId,
          { energy: progress.energy + rewardPayload.energy },
          client
        );
      }
    }

    // Apply stars
    if (typeof rewardPayload.stars === 'number' && rewardPayload.stars > 0) {
      const progress = await ProgressRepository.getProgress(userId, client);
      if (progress) {
        await ProgressRepository.updateProgress(
          userId,
          { starsBalance: progress.starsBalance + rewardPayload.stars },
          client
        );
      }
    }

    // Apply cosmetics (would need CosmeticService integration)
    // TODO: Grant cosmetics to user

    logger.info({ userId, rewardPayload }, 'season_rewards_applied');
  }
}
