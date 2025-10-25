import { transaction } from '../db/connection';
import { config } from '../config';
import { contentService } from './ContentService';
import { updateProgress } from '../repositories/ProgressRepository';
import { secondsBetween } from '../utils/time';
import { calculateLevelProgress } from '../utils/level';
import { tapEnergyForLevel, xpFromEnergy } from '../utils/tap';
import { logEvent } from '../repositories/EventRepository';
import { loadPlayerContext } from './playerContext';
import { UserProfileRecord } from '../repositories/ProfileRepository';
import { BoostRecord } from '../repositories/BoostRepository';
import { UserCosmeticRecord } from '../repositories/UserCosmeticsRepository';
import {
  BuildingDetail,
  buildBuildingDetails,
  computePassiveIncome as computePassiveIncomeSnapshot,
} from './passiveIncome';
import { upsertInventoryItem } from '../repositories/InventoryRepository';
import { invalidateProfileCache } from '../cache/invalidation';

interface OfflineGains {
  energy: number;
  xp: number;
  duration_sec: number;
  capped: boolean;
}

interface SessionState {
  user: {
    id: string;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    is_admin: boolean;
  };
  progress: {
    level: number;
    xp: number;
    xp_into_level: number;
    xp_to_next_level: number;
    energy: number;
    total_energy_produced: number;
    passive_income_per_sec: number;
    passive_income_multiplier: number;
    boost_multiplier: number;
    prestige_multiplier: number;
    prestige_level: number;
    prestige_energy_since_reset: number;
    prestige_last_reset: string | null;
    tap_level: number;
    tap_income: number;
    last_login: string | null;
    last_logout: string | null;
  };
  inventory: BuildingDetail[];
  boosts: BoostRecord[];
  profile: UserProfileRecord;
  cosmetics: UserCosmeticRecord[];
  offline_gains: OfflineGains;
  feature_flags: Record<string, boolean>;
  server_time: string;
}

export class SessionService {
  async openSession(userId: string): Promise<SessionState> {
    const now = new Date();

    const state = await transaction(async client => {
      const { user, progress, inventory, boosts, profile, cosmetics } = await loadPlayerContext(
        userId,
        client
      );

      let effectiveInventory = inventory;

      const hasSolarPanel = inventory.some(item => item.buildingId === 'solar_panel');
      if (!hasSolarPanel && progress.level <= 2) {
        const granted = await upsertInventoryItem(user.id, 'solar_panel', 1, 0, client);
        effectiveInventory = [...inventory, granted];
        await logEvent(
          userId,
          'building_purchase',
          {
            building_id: 'solar_panel',
            cost: 0,
            new_count: granted.count,
            auto_grant: true,
          },
          { client }
        );
      }

      const detailedInventory = buildBuildingDetails(effectiveInventory, progress.level);
      const passiveIncomeSnapshot = computePassiveIncomeSnapshot(
        detailedInventory,
        boosts,
        progress.prestigeMultiplier
      );
      const { baseIncome, boostMultiplier, prestigeMultiplier, effectiveMultiplier, effectiveIncome } =
        passiveIncomeSnapshot;

      const offlineSecondsRaw = progress.lastLogout
        ? secondsBetween(progress.lastLogout, now)
        : 0;
      const maxOfflineSeconds = config.session.maxOfflineHours * 3600;
      const offlineSeconds = Math.min(offlineSecondsRaw, maxOfflineSeconds);

      const offlineEnergy = Math.floor(
        effectiveIncome * offlineSeconds * config.session.offlineIncomeMultiplier
      );
      const offlineXp = xpFromEnergy(offlineEnergy);

      const totalEnergyProduced = progress.totalEnergyProduced + offlineEnergy;
      const energyBalance = progress.energy + offlineEnergy;
      const totalXp = progress.xp + offlineXp;
      const levelProgress = calculateLevelProgress(totalXp);
      const leveledUp = levelProgress.level !== progress.level;

      const updatedProgress = await updateProgress(
        userId,
        {
          energy: energyBalance,
          totalEnergyProduced,
          xp: totalXp,
          level: levelProgress.level,
          lastLogin: now,
          lastLogout: null,
        },
        client
      );

      if (offlineEnergy > 0) {
        await logEvent(
          userId,
          'offline_income_grant',
          {
            energy: offlineEnergy,
            xp: offlineXp,
            duration_sec: offlineSeconds,
            capped: offlineSecondsRaw > maxOfflineSeconds,
            leveled_up: leveledUp,
          },
          { client }
        );
      }

      const featureFlags = contentService.getFeatureFlags()?.features ?? {};

      return {
        user,
        progress: updatedProgress,
        inventory: detailedInventory,
        boosts,
        profile,
        cosmetics,
        offline: {
          energy: offlineEnergy,
          xp: offlineXp,
          duration_sec: offlineSeconds,
          capped: offlineSecondsRaw > maxOfflineSeconds,
        },
        passiveIncome: baseIncome,
        boostMultiplier,
        prestigeMultiplier,
        effectiveMultiplier,
        effectivePassiveIncome: effectiveIncome,
        featureFlags,
      };
    });

    await invalidateProfileCache(userId);

    const tapIncome = tapEnergyForLevel(state.progress.tapLevel);
    const levelInfo = calculateLevelProgress(state.progress.xp);

    return {
      user: {
        id: state.user.id,
        telegram_id: state.user.telegramId,
        username: state.user.username,
        first_name: state.user.firstName,
        last_name: state.user.lastName,
        is_admin: state.user.isAdmin,
      },
      progress: {
        level: state.progress.level,
        xp: state.progress.xp,
        xp_into_level: levelInfo.xpIntoLevel,
        xp_to_next_level: levelInfo.xpToNextLevel,
        energy: state.progress.energy,
        total_energy_produced: state.progress.totalEnergyProduced,
        passive_income_per_sec: Math.floor(state.effectivePassiveIncome),
        passive_income_multiplier: state.effectiveMultiplier,
        boost_multiplier: state.boostMultiplier,
        prestige_multiplier: state.prestigeMultiplier,
        prestige_level: state.progress.prestigeLevel,
        prestige_energy_since_reset:
          state.progress.totalEnergyProduced - state.progress.prestigeEnergySnapshot,
        prestige_last_reset: state.progress.prestigeLastReset
          ? state.progress.prestigeLastReset.toISOString()
          : null,
        tap_level: state.progress.tapLevel,
        tap_income: tapIncome,
        last_login: state.progress.lastLogin ? state.progress.lastLogin.toISOString() : null,
        last_logout: state.progress.lastLogout ? state.progress.lastLogout.toISOString() : null,
      },
      inventory: state.inventory,
      boosts: state.boosts,
      profile: state.profile,
      cosmetics: state.cosmetics,
      offline_gains: state.offline,
      feature_flags: state.featureFlags,
      server_time: now.toISOString(),
    };
  }

  async recordLogout(userId: string): Promise<void> {
    await updateProgress(userId, { lastLogout: new Date() });
    await logEvent(userId, 'logout', {});
  }
}
