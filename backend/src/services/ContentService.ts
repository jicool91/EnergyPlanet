/**
 * Content Service
 * Load game content from YAML/JSON files
 */

import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { config } from '../config';
import { logger } from '../utils/logger';

type BoostOverrides = Record<string, unknown>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
};

const isFeatureFlagsPayload = (value: unknown): value is FeatureFlagsPayload =>
  isRecord(value) && isRecord(value.features);

const isBuildingsPayload = (value: unknown): value is BuildingsPayload =>
  isRecord(value) && Array.isArray(value.buildings);

const isCosmeticsPayload = (value: unknown): value is CosmeticsPayload =>
  isRecord(value) && Array.isArray(value.cosmetics);

const isStarPackPayload = (value: unknown): value is StarPackPayload =>
  isRecord(value) && (!('packs' in value) || Array.isArray(value.packs));

const isSeasonPayload = (value: unknown): value is Season =>
  isRecord(value) && isRecord(value.season) && typeof value.season?.id === 'string';

interface Building {
  id: string;
  name: string;
  description?: string;
  base_income: number;
  base_cost: number;
  unlock_level: number;
  tier?: number;
  category?: string;
  rarity?: string;
  cost_multiplier?: number;
  upgrade_cost_multiplier?: number;
  upgrade_income_bonus?: number;
  upgrade_soft_cap_level?: number;
  upgrade_post_soft_cap_multiplier?: number;
  max_count?: number;
  feature_flag?: string;
}

interface Cosmetic {
  id: string;
  name: string;
  description?: string;
  category: string;
  rarity: string;
  unlock_type?: string;
  unlock_requirement?: Record<string, unknown>;
  asset_url?: string;
  preview_url?: string;
}

interface Season {
  season: {
    id: string;
    number: number;
    name: string;
  };
}

interface FeatureFlags {
  features: Record<string, boolean>;
  experiments: Record<string, unknown>;
  boosts?: BoostOverrides;
}

interface BuildingsPayload {
  buildings: Building[];
  formulas?: BuildingFormulas;
}

interface CosmeticsPayload {
  cosmetics: Cosmetic[];
}

interface StarPackPayload {
  packs?: StarPack[];
}

interface ReferralsPayload extends Partial<ReferralConfig> {}

interface FeatureFlagsPayload {
  features: Record<string, unknown>;
  experiments?: Record<string, unknown>;
  boosts?: unknown;
}

interface BuildingFormulas {
  building_cost: string;
  building_upgrade_cost: string;
  building_income: string;
  max_buildings_per_type: string;
}

interface StarPack {
  id: string;
  title: string;
  description?: string;
  stars: number;
  bonus_stars?: number;
  price_usd?: number;
  price_rub?: number;
  telegram_product_id?: string;
  icon_url?: string;
  featured?: boolean;
}

type QuestType = 'daily' | 'weekly';

interface QuestDefinition {
  id: string;
  title: string;
  description?: string;
  type: QuestType;
  metric: string;
  target: number;
  reward: {
    stars?: number;
    energy?: number;
    xp?: number;
  };
}

export interface ReferralRewardConfig {
  stars?: number;
  cosmeticId?: string;
  title?: string;
  description?: string;
}

export interface ReferralMilestoneConfig {
  id: string;
  title: string;
  description?: string;
  threshold: number;
  rewards: ReferralRewardConfig;
}

export interface ReferralEventConfig {
  id: string;
  label: string;
  description?: string;
  start: string;
  end: string;
  inviteeRewardMultiplier?: number;
  referrerRewardMultiplier?: number;
  milestoneRewardMultiplier?: number;
}

export interface ReferralLimitsConfig {
  dailyActivations: number;
  dailyRewardClaims: number;
}

export interface ReferralConfig {
  inviteeReward: ReferralRewardConfig;
  referrerReward: ReferralRewardConfig;
  milestones: ReferralMilestoneConfig[];
  limits: ReferralLimitsConfig;
  events?: ReferralEventConfig[];
  share?: {
    headline?: string;
    message?: string;
  };
}

class ContentService {
  private buildings: Building[] = [];
  private cosmetics: Cosmetic[] = [];
  private season: Season | null = null;
  private featureFlags: FeatureFlags | null = null;
  private formulas: BuildingFormulas | null = null;
  private starPacks: StarPack[] = [];
  private questDefinitions: Record<QuestType, QuestDefinition[]> = {
    daily: [],
    weekly: [],
  };
  private referralConfig: ReferralConfig | null = null;

  async load() {
    try {
      logger.info(
        {
          contentPath: config.content.path,
          dirname: __dirname,
        },
        'content_loading_started'
      );

      await Promise.all([
        this.loadBuildings().catch(error => this.handleLoadError('buildings', error)),
        this.loadCosmetics().catch(error => this.handleLoadError('cosmetics', error)),
        this.loadSeason().catch(error => this.handleLoadError('season', error)),
        this.loadFeatureFlags().catch(error => this.handleLoadError('featureFlags', error)),
        this.loadStarPacks().catch(error => this.handleLoadError('starPacks', error)),
        this.loadQuests().catch(error => this.handleLoadError('quests', error)),
        this.loadReferrals().catch(error => this.handleLoadError('referrals', error)),
      ]);

      logger.info(
        {
          buildings: this.buildings.length,
          cosmetics: this.cosmetics.length,
          season: this.season?.season.name,
          dailyQuests: this.questDefinitions.daily.length,
          weeklyQuests: this.questDefinitions.weekly.length,
          starPacks: this.starPacks.length,
          referralMilestones: this.referralConfig?.milestones.length ?? 0,
        },
        'content_loaded'
      );
    } catch (error) {
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'content_loaded_with_errors'
      );
      // Don't throw - allow app to start even if content is missing
      // This handles Railway deployments where content might be in different location
    }
  }

  private handleLoadError(contentType: string, error: unknown) {
    logger.warn(
      {
        error: error instanceof Error ? error.message : String(error),
        code:
          typeof error === 'object' && error !== null && 'code' in error
            ? (error as { code?: string }).code
            : undefined,
        path: config.content.path,
        contentType,
      },
      'content_load_failed'
    );
    // Silently continue - defaults will be used
  }

  private async loadBuildings() {
    const filePath = path.join(config.content.path, 'items', 'buildings.json');
    const parsed = await parseJson<unknown>(filePath);
    if (!isBuildingsPayload(parsed)) {
      throw new Error('Invalid buildings payload');
    }
    const payload: BuildingsPayload = parsed;
    this.buildings = payload.buildings;
    this.formulas = payload.formulas ?? null;
  }

  private async loadCosmetics() {
    const filePath = path.join(config.content.path, 'cosmetics', 'skins.json');
    const parsed = await parseJson<unknown>(filePath);
    if (!isCosmeticsPayload(parsed)) {
      throw new Error('Invalid cosmetics payload');
    }
    const payload: CosmeticsPayload = parsed;
    this.cosmetics = payload.cosmetics;
  }

  private async loadSeason() {
    const filePath = path.join(config.content.path, 'seasons', 'season_001.yaml');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = YAML.parse(data) as unknown;
    if (!isSeasonPayload(parsed)) {
      throw new Error('Invalid season payload');
    }
    this.season = parsed;
  }

  private async loadFeatureFlags() {
    const filePath = path.join(config.content.path, 'flags', 'default.json');
    const parsed = await parseJson<unknown>(filePath);
    if (!isFeatureFlagsPayload(parsed)) {
      throw new Error('Invalid feature flag payload');
    }
    const featuresRaw = parsed.features;
    const features: Record<string, boolean> = {};
    Object.entries(featuresRaw).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        features[key] = value;
      }
    });

    const experiments = isRecord(parsed.experiments) ? parsed.experiments : {};
    const boosts: BoostOverrides | undefined = isRecord(parsed.boosts)
      ? parsed.boosts
      : undefined;
    this.featureFlags = {
      features,
      experiments,
      boosts,
    };
  }

  private async loadStarPacks() {
    const filePath = path.join(config.content.path, 'monetization', 'star_packs.json');
    const parsed = await parseJson<unknown>(filePath);
    if (!isStarPackPayload(parsed)) {
      throw new Error('Invalid star packs payload');
    }
    const payload: StarPackPayload = parsed;
    this.starPacks = Array.isArray(payload.packs) ? payload.packs : [];
  }

  private async loadQuests() {
    const filePath = path.join(config.content.path, 'quests', 'quests.json');
    const parsed = await parseJson<Partial<Record<QuestType, QuestDefinition[]>>>(filePath);
    this.questDefinitions = {
      daily: (parsed.daily ?? []).map(q => ({ ...q, type: 'daily' })),
      weekly: (parsed.weekly ?? []).map(q => ({ ...q, type: 'weekly' })),
    };
  }

  private async loadReferrals() {
    const filePath = path.join(config.content.path, 'referrals.json');
    const parsed = await parseJson<ReferralsPayload>(filePath);
    this.referralConfig = {
      inviteeReward: parsed.inviteeReward ?? {},
      referrerReward: parsed.referrerReward ?? {},
      milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
      limits: parsed.limits ?? { dailyActivations: 10, dailyRewardClaims: 5 },
      events: parsed.events ?? [],
      share: parsed.share,
    };
  }

  getBuildings(): Building[] {
    return this.buildings;
  }

  getBuilding(id: string): Building | undefined {
    return this.buildings.find(b => b.id === id);
  }

  getCosmetics(): Cosmetic[] {
    return this.cosmetics;
  }

  getCosmetic(id: string): Cosmetic | undefined {
    return this.cosmetics.find(c => c.id === id);
  }

  getSeason(): Season | null {
    return this.season;
  }

  getFeatureFlags(): FeatureFlags | null {
    return this.featureFlags;
  }

  getStarPacks(): StarPack[] {
    return this.starPacks;
  }

  getQuestDefinitions(type?: QuestType): QuestDefinition[] {
   if (!type) {
     return [...this.questDefinitions.daily, ...this.questDefinitions.weekly];
   }
   return this.questDefinitions[type] ?? [];
 }

  getReferralConfig(): ReferralConfig | null {
    return this.referralConfig;
  }

  isFeatureEnabled(featureName: string): boolean {
    return this.featureFlags?.features[featureName] ?? false;
  }

  isBuildingAvailable(building: Building, playerLevel: number): boolean {
    if (building.unlock_level > playerLevel) {
      return false;
    }

    if (building.feature_flag) {
      return this.isFeatureEnabled(building.feature_flag);
    }

    return true;
  }

  getBuildingCost(building: Building, currentCount: number): number {
    const multiplier = building.cost_multiplier ?? 1;
    const baseCost = building.base_cost ?? 0;
    const cost = baseCost * Math.pow(multiplier, currentCount);
    return Math.ceil(cost);
  }

  getBuildingUpgradeCost(building: Building, currentLevel: number): number {
    const upgradeMultiplier = building.upgrade_cost_multiplier ?? 1;
    const baseCost = building.base_cost ?? 0;
    const softCapLevel = building.upgrade_soft_cap_level;
    const postSoftCapMultiplier = building.upgrade_post_soft_cap_multiplier ?? upgradeMultiplier;
    const normalizedLevel = Math.max(0, currentLevel);

    if (softCapLevel !== undefined && normalizedLevel > softCapLevel) {
      const cappedMultiplier = Math.pow(upgradeMultiplier, softCapLevel);
      const extraLevels = normalizedLevel - softCapLevel;
      const postMultiplier = Math.pow(postSoftCapMultiplier, extraLevels);
      const cost = baseCost * 5 * cappedMultiplier * postMultiplier;
      return Math.ceil(cost);
    }

    const cost = baseCost * 5 * Math.pow(upgradeMultiplier, normalizedLevel);
    return Math.ceil(cost);
  }

  getBuildingIncome(building: Building, count: number, level: number): number {
    const base = building.base_income ?? 0;
    const upgradeBonus = building.upgrade_income_bonus ?? 0;
    const income = base * count * (1 + level * upgradeBonus);
    return Math.floor(income);
  }

  getMaxBuildingCount(playerLevel: number): number {
    if (!this.formulas) {
      return 999;
    }

    const base = 50;
    const perLevel = 2;
    return Math.floor(base + playerLevel * perLevel);
  }
}

// Singleton instance
const contentService = new ContentService();

export async function loadContent() {
  await contentService.load();
}

export type { QuestDefinition };
export { contentService };
