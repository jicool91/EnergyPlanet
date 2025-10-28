/**
 * Content Service
 * Load game content from YAML/JSON files
 */

import fs from 'fs/promises';
import path from 'path';
import YAML from 'yaml';
import { config } from '../config';
import { logger } from '../utils/logger';

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
  boosts?: Record<string, unknown>;
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
      logger.info('ContentService: Starting to load game content', {
        contentPath: config.content.path,
        __dirname: __dirname,
      });

      await Promise.all([
        this.loadBuildings().catch(e => this.handleLoadError('buildings', e)),
        this.loadCosmetics().catch(e => this.handleLoadError('cosmetics', e)),
        this.loadSeason().catch(e => this.handleLoadError('season', e)),
        this.loadFeatureFlags().catch(e => this.handleLoadError('featureFlags', e)),
        this.loadStarPacks().catch(e => this.handleLoadError('starPacks', e)),
        this.loadQuests().catch(e => this.handleLoadError('quests', e)),
        this.loadReferrals().catch(e => this.handleLoadError('referrals', e)),
      ]);

      logger.info('Content loaded successfully', {
        buildings: this.buildings.length,
        cosmetics: this.cosmetics.length,
        season: this.season?.season.name,
        dailyQuests: this.questDefinitions.daily.length,
        weeklyQuests: this.questDefinitions.weekly.length,
        starPacks: this.starPacks.length,
        referralMilestones: this.referralConfig?.milestones.length ?? 0,
      });
    } catch (error) {
      logger.warn('Content loading completed with errors (this is OK for MVP)', error);
      // Don't throw - allow app to start even if content is missing
      // This handles Railway deployments where content might be in different location
    }
  }

  private async handleLoadError(contentType: string, error: unknown) {
    logger.warn(`Failed to load ${contentType}`, {
      error: error instanceof Error ? error.message : String(error),
      code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string }).code : undefined,
      path: config.content.path,
    });
    // Silently continue - defaults will be used
  }

  private async loadBuildings() {
    const filePath = path.join(config.content.path, 'items', 'buildings.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    this.buildings = parsed.buildings;
    this.formulas = parsed.formulas as BuildingFormulas;
  }

  private async loadCosmetics() {
    const filePath = path.join(config.content.path, 'cosmetics', 'skins.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    this.cosmetics = parsed.cosmetics;
  }

  private async loadSeason() {
    const filePath = path.join(config.content.path, 'seasons', 'season_001.yaml');
    const data = await fs.readFile(filePath, 'utf-8');
    this.season = YAML.parse(data);
  }

  private async loadFeatureFlags() {
    const filePath = path.join(config.content.path, 'flags', 'default.json');
    const data = await fs.readFile(filePath, 'utf-8');
    this.featureFlags = JSON.parse(data);
  }

  private async loadStarPacks() {
    const filePath = path.join(config.content.path, 'monetization', 'star_packs.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    this.starPacks = parsed.packs ?? [];
  }

  private async loadQuests() {
    const filePath = path.join(config.content.path, 'quests', 'quests.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data) as Partial<Record<QuestType, QuestDefinition[]>>;
    this.questDefinitions = {
      daily: (parsed.daily ?? []).map(q => ({ ...q, type: 'daily' })),
      weekly: (parsed.weekly ?? []).map(q => ({ ...q, type: 'weekly' })),
    };
  }

  private async loadReferrals() {
    const filePath = path.join(config.content.path, 'referrals.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data) as ReferralConfig;
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
