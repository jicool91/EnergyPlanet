import client from 'prom-client';
import { metricsEnabled, register } from './index';

type TapRateLimitWindow = 'second' | 'minute' | 'unknown';

const tapRequestCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tap_requests_total',
      help: 'Количество запросов на обработку тапов',
      registers: [register],
    })
  : null;

const tapRequestedTapsCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_taps_requested_total',
      help: 'Суммарное количество тапов, присланных игроками',
      registers: [register],
    })
  : null;

const tapRateLimitCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tap_rate_limit_total',
      help: 'Срабатывания лимитов по тачам',
      labelNames: ['window'] as const,
      registers: [register],
    })
  : null;

const tapBatchCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tap_batches_total',
      help: 'Количество сброшенных батчей тапов',
      labelNames: ['leveled_up'] as const,
      registers: [register],
    })
  : null;

const tapBatchTapsCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tap_batch_taps_total',
      help: 'Всего тапов, сброшенных батчами',
      labelNames: ['leveled_up'] as const,
      registers: [register],
    })
  : null;

const tapBatchEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tap_batch_energy_total',
      help: 'Энергия, начисленная батчами',
      labelNames: ['type'] as const,
      registers: [register],
    })
  : null;

const tapBatchXpCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_tap_batch_xp_total',
      help: 'Опыт, начисленный при сбросе тапов',
      registers: [register],
    })
  : null;

const tapBatchLatencyHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_tap_batch_latency_ms',
      help: 'Время пролеживания батча тапов в буфере',
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
      registers: [register],
    })
  : null;

const buildingPurchaseCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_building_purchases_total',
      help: 'Покупки зданий',
      labelNames: ['building_id', 'source'] as const,
      registers: [register],
    })
  : null;

const buildingPurchaseEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_building_purchase_energy_spent_total',
      help: 'Энергия, потраченная на покупку зданий',
      labelNames: ['building_id', 'source'] as const,
      registers: [register],
    })
  : null;

const buildingPurchaseXpCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_building_purchase_xp_total',
      help: 'Опыт, полученный за покупки зданий',
      labelNames: ['building_id'] as const,
      registers: [register],
    })
  : null;

const buildingUpgradeCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_building_upgrades_total',
      help: 'Апгрейды зданий',
      labelNames: ['building_id'] as const,
      registers: [register],
    })
  : null;

const buildingUpgradeEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_building_upgrade_energy_spent_total',
      help: 'Энергия, потраченная на апгрейды зданий',
      labelNames: ['building_id'] as const,
      registers: [register],
    })
  : null;

const buildingUpgradeXpCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_building_upgrade_xp_total',
      help: 'Опыт за апгрейд зданий',
      labelNames: ['building_id'] as const,
      registers: [register],
    })
  : null;

const sessionOpenedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_sessions_opened_total',
      help: 'Открытые игровые сессии',
      labelNames: ['leveled_up'] as const,
      registers: [register],
    })
  : null;

const sessionClosedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_sessions_closed_total',
      help: 'Закрытия игровых сессий',
      registers: [register],
    })
  : null;

const offlineEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_offline_energy_total',
      help: 'Энергия, выданная за оффлайн',
      labelNames: ['capped'] as const,
      registers: [register],
    })
  : null;

const offlineXpCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_offline_xp_total',
      help: 'Опыт, выданный за оффлайн',
      labelNames: ['capped'] as const,
      registers: [register],
    })
  : null;

const offlineDurationHistogram = metricsEnabled
  ? new client.Histogram({
      name: 'energyplanet_offline_duration_seconds',
      help: 'Длительность оффлайна при входе в игру',
      buckets: [0, 60, 300, 900, 1800, 3600, 7200, 14400],
      registers: [register],
    })
  : null;

const questClaimCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_quests_claimed_total',
      help: 'Полученные награды за квесты',
      labelNames: ['quest_type'] as const,
      registers: [register],
    })
  : null;

const questRewardStarsCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_quest_reward_stars_total',
      help: 'Звезды, выданные квестами',
      labelNames: ['quest_type'] as const,
      registers: [register],
    })
  : null;

const questRewardEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_quest_reward_energy_total',
      help: 'Энергия, выданная квестами',
      labelNames: ['quest_type'] as const,
      registers: [register],
    })
  : null;

const questRewardXpCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_quest_reward_xp_total',
      help: 'Опыт, выданный квестами',
      labelNames: ['quest_type'] as const,
      registers: [register],
    })
  : null;

const prestigeCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_prestige_total',
      help: 'Совершенные престижи',
      labelNames: ['gain'] as const,
      registers: [register],
    })
  : null;

const prestigeEnergyCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_prestige_energy_since_reset_total',
      help: 'Энергия, накопленная к моменту престижа',
      registers: [register],
    })
  : null;

const achievementUnlockedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_achievement_unlocked_total',
      help: 'Открытые уровни достижений',
      labelNames: ['slug', 'tier'] as const,
      registers: [register],
    })
  : null;

const achievementClaimedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_achievement_claimed_total',
      help: 'Забранные награды достижений',
      labelNames: ['slug', 'tier'] as const,
      registers: [register],
    })
  : null;

const achievementCosmeticCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_achievement_cosmetic_granted_total',
      help: 'Косметика, выданная за достижения',
      labelNames: ['cosmetic_id'] as const,
      registers: [register],
    })
  : null;

const cosmeticGrantedCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_cosmetics_granted_total',
      help: 'Полученная косметика',
      labelNames: ['cosmetic_id', 'source'] as const,
      registers: [register],
    })
  : null;

const cosmeticEquipCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_cosmetics_equipped_total',
      help: 'Экипировки косметики',
      labelNames: ['cosmetic_id', 'category'] as const,
      registers: [register],
    })
  : null;

const referralCodeCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_referral_codes_created_total',
      help: 'Сгенерированные реферальные коды',
      registers: [register],
    })
  : null;

const referralActivationCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_referral_activations_total',
      help: 'Активации реферальных кодов',
      registers: [register],
    })
  : null;

const referralRewardCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_referral_rewards_total',
      help: 'Выданные реферальные награды',
      labelNames: ['type', 'cosmetic'] as const,
      registers: [register],
    })
  : null;

const referralRewardStarsCounter = metricsEnabled
  ? new client.Counter({
      name: 'energyplanet_referral_reward_stars_total',
      help: 'Звезды, выданные реферальной программой',
      labelNames: ['type'] as const,
      registers: [register],
    })
  : null;

export function recordTapRequestMetric(tapCount: number): void {
  if (!metricsEnabled) {
    return;
  }
  tapRequestCounter?.inc();
  if (tapCount > 0) {
    tapRequestedTapsCounter?.inc(tapCount);
  }
}

export function recordTapRateLimitMetric(window: TapRateLimitWindow): void {
  if (!metricsEnabled) {
    return;
  }
  tapRateLimitCounter?.inc({ window });
}

export function recordTapBatchMetric(params: {
  taps: number;
  energy: number;
  baseEnergy: number;
  xp: number;
  latencyMs: number;
  leveledUp: boolean;
}): void {
  if (!metricsEnabled) {
    return;
  }
  const leveledLabel = params.leveledUp ? 'true' : 'false';
  tapBatchCounter?.inc({ leveled_up: leveledLabel });
  if (params.taps > 0) {
    tapBatchTapsCounter?.inc({ leveled_up: leveledLabel }, params.taps);
  }
  if (params.energy > 0) {
    tapBatchEnergyCounter?.inc({ type: 'boosted' }, params.energy);
  }
  if (params.baseEnergy > 0) {
    tapBatchEnergyCounter?.inc({ type: 'base' }, params.baseEnergy);
  }
  if (params.xp > 0) {
    tapBatchXpCounter?.inc(params.xp);
  }
  if (params.latencyMs >= 0) {
    tapBatchLatencyHistogram?.observe(params.latencyMs);
  }
}

export function recordBuildingPurchaseMetric(params: {
  buildingId: string;
  quantity: number;
  energySpent: number;
  xpGained: number;
  source: 'player' | 'auto_grant';
}): void {
  if (!metricsEnabled) {
    return;
  }
  const source = params.source;
  if (params.quantity > 0) {
    buildingPurchaseCounter?.inc(
      { building_id: params.buildingId, source },
      params.quantity
    );
  }
  if (params.energySpent > 0) {
    buildingPurchaseEnergyCounter?.inc(
      { building_id: params.buildingId, source },
      params.energySpent
    );
  }
  if (params.xpGained > 0) {
    buildingPurchaseXpCounter?.inc({ building_id: params.buildingId }, params.xpGained);
  }
}

export function recordBuildingUpgradeMetric(params: {
  buildingId: string;
  energySpent: number;
  xpGained: number;
}): void {
  if (!metricsEnabled) {
    return;
  }
  buildingUpgradeCounter?.inc({ building_id: params.buildingId });
  if (params.energySpent > 0) {
    buildingUpgradeEnergyCounter?.inc({ building_id: params.buildingId }, params.energySpent);
  }
  if (params.xpGained > 0) {
    buildingUpgradeXpCounter?.inc({ building_id: params.buildingId }, params.xpGained);
  }
}

export function recordSessionOpenMetric(leveledUp: boolean): void {
  if (!metricsEnabled) {
    return;
  }
  sessionOpenedCounter?.inc({ leveled_up: leveledUp ? 'true' : 'false' });
}

export function recordSessionLogoutMetric(): void {
  if (!metricsEnabled) {
    return;
  }
  sessionClosedCounter?.inc();
}

export function recordOfflineRewardMetric(params: {
  energy: number;
  xp: number;
  durationSec: number;
  capped: boolean;
}): void {
  if (!metricsEnabled) {
    return;
  }
  const cappedLabel = params.capped ? 'true' : 'false';
  if (params.energy > 0) {
    offlineEnergyCounter?.inc({ capped: cappedLabel }, params.energy);
  }
  if (params.xp > 0) {
    offlineXpCounter?.inc({ capped: cappedLabel }, params.xp);
  }
  if (params.durationSec >= 0) {
    offlineDurationHistogram?.observe(params.durationSec);
  }
}

export function recordQuestClaimMetric(params: {
  questType: string;
  stars: number;
  energy: number;
  xp: number;
}): void {
  if (!metricsEnabled) {
    return;
  }
  questClaimCounter?.inc({ quest_type: params.questType });
  if (params.stars > 0) {
    questRewardStarsCounter?.inc({ quest_type: params.questType }, params.stars);
  }
  if (params.energy > 0) {
    questRewardEnergyCounter?.inc({ quest_type: params.questType }, params.energy);
  }
  if (params.xp > 0) {
    questRewardXpCounter?.inc({ quest_type: params.questType }, params.xp);
  }
}

export function recordPrestigeMetric(params: { gain: number; energySinceReset: number }): void {
  if (!metricsEnabled) {
    return;
  }
  prestigeCounter?.inc({ gain: String(params.gain) });
  if (params.energySinceReset > 0) {
    prestigeEnergyCounter?.inc(params.energySinceReset);
  }
}

export function recordAchievementUnlockedMetric(slug: string, tier: number): void {
  if (!metricsEnabled) {
    return;
  }
  achievementUnlockedCounter?.inc({ slug, tier: String(tier) });
}

export function recordAchievementClaimedMetric(slug: string, tier: number): void {
  if (!metricsEnabled) {
    return;
  }
  achievementClaimedCounter?.inc({ slug, tier: String(tier) });
}

export function recordAchievementCosmeticMetric(cosmeticId: string): void {
  if (!metricsEnabled) {
    return;
  }
  achievementCosmeticCounter?.inc({ cosmetic_id: cosmeticId });
}

export function recordCosmeticGrantedMetric(params: {
  cosmeticId: string;
  source: 'auto_unlock' | 'purchase' | 'reward';
}): void {
  if (!metricsEnabled) {
    return;
  }
  cosmeticGrantedCounter?.inc({
    cosmetic_id: params.cosmeticId,
    source: params.source,
  });
}

export function recordCosmeticEquipMetric(params: {
  cosmeticId: string;
  category: string;
}): void {
  if (!metricsEnabled) {
    return;
  }
  cosmeticEquipCounter?.inc({
    cosmetic_id: params.cosmeticId,
    category: params.category,
  });
}

export function recordReferralCodeMetric(): void {
  if (!metricsEnabled) {
    return;
  }
  referralCodeCounter?.inc();
}

export function recordReferralActivationMetric(): void {
  if (!metricsEnabled) {
    return;
  }
  referralActivationCounter?.inc();
}

export function recordReferralRewardMetric(params: {
  type: 'invitee' | 'referrer' | 'milestone';
  stars: number;
  cosmeticGranted: boolean;
}): void {
  if (!metricsEnabled) {
    return;
  }
  referralRewardCounter?.inc({
    type: params.type,
    cosmetic: params.cosmeticGranted ? 'true' : 'false',
  });
  if (params.stars > 0) {
    referralRewardStarsCounter?.inc({ type: params.type }, params.stars);
  }
}
