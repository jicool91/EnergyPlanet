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
import { achievementService } from './AchievementService';
import {
  recordBuildingPurchaseMetric,
  recordOfflineRewardMetric,
  recordSessionLogoutMetric,
  recordSessionOpenMetric,
} from '../metrics/gameplay';
import { recordSessionDurationMetric } from '../metrics/business';
import { constructionService } from './ConstructionService';

interface BuilderSlotView {
  slot_index: number;
  status: 'active' | 'inactive' | 'expired';
  speed_multiplier: number;
  expires_at: string | null;
}

interface ConstructionJobView {
  id: string;
  building_id: string;
  action: 'build' | 'upgrade';
  builder_slot: number;
  completes_at: string;
  duration_seconds: number;
  status: 'queued' | 'running' | 'completed' | 'cancelled';
  xp_reward: number;
  quantity: number;
}

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
    stars_balance: number;
    total_energy_produced: number;
    passive_income_per_sec: number;
    passive_income_multiplier: number;
    boost_multiplier: number;
    prestige_multiplier: number;
    achievement_multiplier: number;
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
  passiveIncome: number;
  boostMultiplier: number;
  prestigeMultiplier: number;
  achievementMultiplier: number;
  effectiveMultiplier: number;
  effectivePassiveIncome: number;
  construction: {
    builders: BuilderSlotView[];
    jobs: {
      active: ConstructionJobView[];
      queued: ConstructionJobView[];
    };
  };
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
        recordBuildingPurchaseMetric({
          buildingId: 'solar_panel',
          quantity: 1,
          energySpent: 0,
          xpGained: 0,
          source: 'auto_grant',
        });
      }

      const detailedInventory = buildBuildingDetails(effectiveInventory, progress.level);
      const passiveIncomeSnapshot = computePassiveIncomeSnapshot(
        detailedInventory,
        boosts,
        progress.prestigeMultiplier,
        progress.achievementMultiplier
      );
      const {
        baseIncome,
        boostMultiplier,
        prestigeMultiplier,
        achievementMultiplier,
        effectiveMultiplier,
        effectiveIncome,
      } =
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

      await achievementService.syncMetric(userId, 'total_energy', totalEnergyProduced, client);
      await achievementService.syncMetric(userId, 'prestige_level', updatedProgress.prestigeLevel, client);
      await achievementService.syncMetric(
        userId,
        'buildings_owned',
        updatedProgress.totalBuildingsPurchased,
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
      const constructionSnapshot = await constructionService.getSnapshot(userId, client);
      const mapBuilder = (builder: { slotIndex: number; status: 'active' | 'inactive' | 'expired'; speedMultiplier: number; expiresAt: Date | null; }) => ({
        slot_index: builder.slotIndex,
        status: builder.status,
        speed_multiplier: builder.speedMultiplier,
        expires_at: builder.expiresAt ? builder.expiresAt.toISOString() : null,
      });
      const mapJob = (job: { id: string; buildingId: string; action: 'build' | 'upgrade'; builderSlot: number; completesAt: Date; durationSeconds: number; status: 'queued' | 'running' | 'completed' | 'cancelled'; xpReward: number; quantity: number; }) => ({
        id: job.id,
        building_id: job.buildingId,
        action: job.action,
        builder_slot: job.builderSlot,
        completes_at: job.completesAt.toISOString(),
        duration_seconds: job.durationSeconds,
        status: job.status,
        xp_reward: job.xpReward,
        quantity: job.quantity,
      });
      const construction = {
        builders: constructionSnapshot.builders.map(mapBuilder),
        jobs: {
          active: constructionSnapshot.jobs.active.map(mapJob),
          queued: constructionSnapshot.jobs.queued.map(mapJob),
        },
      };

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
        achievementMultiplier,
        effectiveMultiplier,
        effectivePassiveIncome: effectiveIncome,
        featureFlags,
        leveledUp,
        construction,
      };
    });

    recordSessionOpenMetric(state.leveledUp);
    recordOfflineRewardMetric({
      energy: state.offline.energy,
      xp: state.offline.xp,
      durationSec: state.offline.duration_sec,
      capped: state.offline.capped,
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
        stars_balance: state.progress.starsBalance,
        total_energy_produced: state.progress.totalEnergyProduced,
        passive_income_per_sec: Math.floor(state.effectivePassiveIncome),
        passive_income_multiplier: state.effectiveMultiplier,
        boost_multiplier: state.boostMultiplier,
        prestige_multiplier: state.prestigeMultiplier,
        achievement_multiplier: state.achievementMultiplier,
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
      passiveIncome: state.passiveIncome,
      boostMultiplier: state.boostMultiplier,
      prestigeMultiplier: state.prestigeMultiplier,
      achievementMultiplier: state.achievementMultiplier,
      effectiveMultiplier: state.effectiveMultiplier,
      effectivePassiveIncome: state.effectivePassiveIncome,
      feature_flags: state.featureFlags,
      server_time: now.toISOString(),
      construction: state.construction,
    };
  }

  async recordLogout(userId: string): Promise<void> {
    const now = new Date();

    // Get current progress to calculate session duration
    const { progress } = await loadPlayerContext(userId);

    await updateProgress(userId, { lastLogout: now });
    await logEvent(userId, 'logout', {});

    // Record session duration metric
    if (progress.lastLogin) {
      const sessionDurationSec = secondsBetween(progress.lastLogin, now);
      if (sessionDurationSec > 0 && sessionDurationSec < 86400) {
        // Only record if duration is reasonable (< 24 hours)
        recordSessionDurationMetric(sessionDurationSec);
      }
    }

    recordSessionLogoutMetric();
  }
}
