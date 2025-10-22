import config from '../config';
import { cacheKeys } from '../cache/cacheKeys';
import { getCache, setCache } from '../cache/redis';
import { transaction } from '../db/connection';
import { loadPlayerContext } from './playerContext';
import { buildBuildingDetails, computePassiveIncome } from './passiveIncome';
import { calculateLevelProgress } from '../utils/level';
import { tapEnergyForLevel } from '../utils/tap';

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
    passive_income_per_sec: number;
    passive_income_multiplier: number;
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
}

export class ProfileService {
  async getProfile(userId: string) {
    if (config.cache.enabled) {
      const cached = await getCache<CachedProfile>(cacheKeys.profile(userId));
      if (cached) {
        return cached;
      }
    }

    const context = await transaction(client => loadPlayerContext(userId, client));

    const buildingDetails = buildBuildingDetails(context.inventory, context.progress.level);
    const passiveIncome = computePassiveIncome(buildingDetails, context.boosts);
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
        passive_income_per_sec: passiveIncome.effectiveIncome,
        passive_income_multiplier: passiveIncome.boostMultiplier,
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
    };

    if (config.cache.enabled) {
      await setCache(cacheKeys.profile(userId), payload, config.cache.ttl.profile);
    }

    return payload;
  }
}

export const profileService = new ProfileService();
