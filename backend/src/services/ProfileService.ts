import config from '../config';
import { cacheKeys } from '../cache/cacheKeys';
import { getCache, setCache } from '../cache/redis';
import { transaction } from '../db/connection';
import { loadPlayerContext } from './playerContext';
import { buildBuildingDetails, computePassiveIncome } from './passiveIncome';
import { calculateLevelProgress } from '../utils/level';
import { tapEnergyForLevel } from '../utils/tap';
import { contentService } from './ContentService';
import {
  countReferralRelations,
  countReferralRelationsSince,
  getReferralRelationByReferred,
} from '../repositories/ReferralRepository';
import { findById } from '../repositories/UserRepository';
import { PoolClient } from 'pg';

interface CachedProfile {
  user: {
    id: string;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    is_admin: boolean;
  };
  profile: {
    equipped_avatar_frame: string | null;
    equipped_planet_skin: string | null;
    equipped_tap_effect: string | null;
    equipped_background: string | null;
    bio: string | null;
    is_public: boolean;
    updated_at: string;
  };
  progress: {
    level: number;
    xp: number;
    xp_into_level: number;
    xp_to_next_level: number;
    total_energy_produced: number;
    energy: number;
    tap_level: number;
    tap_income: number;
    prestige_level: number;
    prestige_multiplier: number;
    achievement_multiplier: number;
    prestige_energy_since_reset: number;
    passive_income_per_sec: number;
    passive_income_multiplier: number;
    boost_multiplier: number;
    last_login: string | null;
    last_logout: string | null;
  };
  boosts: Array<{
    id: string;
    boost_type: string;
    multiplier: number;
    expires_at: string;
  }>;
  buildings: ReturnType<typeof buildBuildingDetails>;
  referral: ReferralSnapshot | null;
}

interface ReferralSnapshot {
  total_invites: number;
  daily_invites_used: number;
  daily_invites_limit: number;
  referred_by: {
    user_id: string;
    username: string | null;
    first_name: string | null;
  } | null;
}

export class ProfileService {
  async getProfile(userId: string) {
    if (config.cache.enabled) {
      const cached = await getCache<CachedProfile>(cacheKeys.profile(userId));
      if (cached) {
        return cached;
      }
    }

    const { context, referral } = await transaction(async client => {
      const playerContext = await loadPlayerContext(userId, client);
      const referralData = await this.buildReferralSnapshot(userId, client);
      return { context: playerContext, referral: referralData };
    });

    const buildingDetails = buildBuildingDetails(context.inventory, context.progress.level);
    const passiveIncome = computePassiveIncome(
      buildingDetails,
      context.boosts,
      context.progress.prestigeMultiplier,
      context.progress.achievementMultiplier
    );
    const levelInfo = calculateLevelProgress(context.progress.xp);
    const tapIncome = tapEnergyForLevel(context.progress.tapLevel);

    const payload: CachedProfile = {
      user: {
        id: context.user.id,
        telegram_id: context.user.telegramId,
        username: context.user.username,
        first_name: context.user.firstName,
        last_name: context.user.lastName,
        is_admin: context.user.isAdmin,
      },
      profile: {
        equipped_avatar_frame: context.profile.equippedAvatarFrame,
        equipped_planet_skin: context.profile.equippedPlanetSkin,
        equipped_tap_effect: context.profile.equippedTapEffect,
        equipped_background: context.profile.equippedBackground,
        bio: context.profile.bio,
        is_public: context.profile.isPublic,
        updated_at: context.profile.updatedAt.toISOString(),
      },
      progress: {
        level: context.progress.level,
        xp: context.progress.xp,
        xp_into_level: levelInfo.xpIntoLevel,
        xp_to_next_level: levelInfo.xpToNextLevel,
        total_energy_produced: context.progress.totalEnergyProduced,
        energy: context.progress.energy,
        tap_level: context.progress.tapLevel,
        tap_income: tapIncome,
        prestige_level: context.progress.prestigeLevel,
        prestige_multiplier: context.progress.prestigeMultiplier,
        achievement_multiplier: context.progress.achievementMultiplier,
        prestige_energy_since_reset:
          context.progress.totalEnergyProduced - context.progress.prestigeEnergySnapshot,
        passive_income_per_sec: passiveIncome.effectiveIncome,
        passive_income_multiplier: passiveIncome.effectiveMultiplier,
        boost_multiplier: passiveIncome.boostMultiplier,
        last_login: context.progress.lastLogin ? context.progress.lastLogin.toISOString() : null,
        last_logout: context.progress.lastLogout ? context.progress.lastLogout.toISOString() : null,
      },
      boosts: context.boosts.map(boost => ({
        id: boost.id,
        boost_type: boost.boostType,
        multiplier: boost.multiplier,
        expires_at: boost.expiresAt.toISOString(),
      })),
      buildings: buildingDetails,
      referral,
    };

    if (config.cache.enabled) {
      await setCache(cacheKeys.profile(userId), payload, config.cache.ttl.profile);
    }

    return payload;
  }

  private async buildReferralSnapshot(
    userId: string,
    client: PoolClient
  ): Promise<ReferralSnapshot | null> {
    const referralConfig = contentService.getReferralConfig();
    if (!referralConfig) {
      return null;
    }

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const [totalInvites, dailyInvites] = await Promise.all([
      countReferralRelations(userId, client),
      countReferralRelationsSince(userId, startOfDay, client),
    ]);

    const relationAsInvitee = await getReferralRelationByReferred(userId, client);
    let referredBy: ReferralSnapshot['referred_by'] = null;
    if (relationAsInvitee) {
      const refUser = await findById(relationAsInvitee.referrerId, client);
      if (refUser) {
        referredBy = {
          user_id: refUser.id,
          username: refUser.username,
          first_name: refUser.firstName,
        };
      }
    }

    return {
      total_invites: totalInvites,
      daily_invites_used: dailyInvites,
      daily_invites_limit: referralConfig.limits?.dailyActivations ?? 0,
      referred_by: referredBy,
    };
  }
}

export const profileService = new ProfileService();
