/**
 * Season Service
 * Manages season progression, leaderboards, and rewards
 */

import { PoolClient } from 'pg';
import { contentService, Season } from './ContentService';
import * as SeasonRepository from '../repositories/SeasonRepository';
import * as ProgressRepository from '../repositories/ProgressRepository';
import { logger } from '../utils/logger';

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
}

export interface SeasonRewardInfo {
  rewardType: string;
  rewardTier: string | null;
  finalRank: number | null;
  rewards: Record<string, unknown>;
  claimed: boolean;
  claimedAt: string | null;
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
