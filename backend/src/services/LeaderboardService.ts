import config from '../config';
import { getCache, setCache } from '../cache/redis';
import { cacheKeys } from '../cache/cacheKeys';
import {
  countPlayers,
  fetchTopEntries,
  fetchUserEntry,
  LeaderboardEntry,
} from '../repositories/LeaderboardRepository';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
interface CachedLeaderboard {
  totalPlayers: number;
  entries: LeaderboardEntry[];
  generatedAt: string;
}

export class LeaderboardService {
  private cacheKey(limit: number) {
    return cacheKeys.leaderboardTop(limit);
  }

  private sanitizeLimit(limit?: number) {
    if (!limit || Number.isNaN(limit)) {
      return DEFAULT_LIMIT;
    }
    return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)));
  }

  private async readCache(limit: number): Promise<CachedLeaderboard | null> {
    if (!config.cache.enabled) {
      return null;
    }
    return getCache<CachedLeaderboard>(this.cacheKey(limit));
  }

  private async writeCache(limit: number, payload: CachedLeaderboard): Promise<void> {
    if (!config.cache.enabled) {
      return;
    }
    await setCache(this.cacheKey(limit), payload, config.cache.ttl.leaderboard);
  }

  async getLeaderboard(viewerId?: string, limitParam?: number) {
    const limit = this.sanitizeLimit(limitParam);

    const cached = await this.readCache(limit);
    let entries: LeaderboardEntry[];
    let totalPlayers: number;

    if (cached) {
      entries = cached.entries;
      totalPlayers = cached.totalPlayers;
    } else {
      const [freshEntries, playerCount] = await Promise.all([
        fetchTopEntries(limit, 0),
        countPlayers(),
      ]);

      entries = freshEntries;
      totalPlayers = playerCount;

      await this.writeCache(limit, {
        totalPlayers,
        entries,
        generatedAt: new Date().toISOString(),
      });
    }

    let viewerEntry: LeaderboardEntry | null = null;

    if (viewerId) {
      viewerEntry = entries.find(entry => entry.userId === viewerId) ?? null;

      if (!viewerEntry) {
        viewerEntry = await fetchUserEntry(viewerId);
      }
    }

    return {
      leaderboard: entries.map(entry => ({
        rank: entry.rank,
        user_id: entry.userId,
        telegram_id: entry.telegramId,
        username: entry.username,
        first_name: entry.firstName,
        last_name: entry.lastName,
        level: entry.level,
        total_energy_produced: entry.totalEnergyProduced,
        equipped_avatar_frame: entry.equippedAvatarFrame,
      })),
      total_players: totalPlayers,
      user_rank: viewerEntry?.rank ?? null,
      user_entry: viewerEntry
        ? {
            rank: viewerEntry.rank,
            user_id: viewerEntry.userId,
            telegram_id: viewerEntry.telegramId,
            username: viewerEntry.username,
            first_name: viewerEntry.firstName,
            last_name: viewerEntry.lastName,
            level: viewerEntry.level,
            total_energy_produced: viewerEntry.totalEnergyProduced,
            equipped_avatar_frame: viewerEntry.equippedAvatarFrame,
          }
        : null,
    };
  }
}

export const leaderboardService = new LeaderboardService();
