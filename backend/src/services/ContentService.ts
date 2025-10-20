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
  base_income: number;
  base_cost: number;
  unlock_level: number;
  cost_multiplier?: number;
  upgrade_cost_multiplier?: number;
  upgrade_income_bonus?: number;
  max_count?: number;
  feature_flag?: string;
  [key: string]: any;
}

interface Cosmetic {
  id: string;
  name: string;
  category: string;
  rarity: string;
  unlock_type: string;
  [key: string]: any;
}

interface Season {
  season: {
    id: string;
    number: number;
    name: string;
    [key: string]: any;
  };
}

interface FeatureFlags {
  features: Record<string, boolean>;
  experiments: Record<string, any>;
  [key: string]: any;
}

interface BuildingFormulas {
  building_cost: string;
  building_upgrade_cost: string;
  building_income: string;
  max_buildings_per_type: string;
}

class ContentService {
  private buildings: Building[] = [];
  private cosmetics: Cosmetic[] = [];
  private season: Season | null = null;
  private featureFlags: FeatureFlags | null = null;
  private formulas: BuildingFormulas | null = null;

  async load() {
    try {
      await Promise.all([
        this.loadBuildings(),
        this.loadCosmetics(),
        this.loadSeason(),
        this.loadFeatureFlags(),
      ]);

      logger.info('Content loaded successfully', {
        buildings: this.buildings.length,
        cosmetics: this.cosmetics.length,
        season: this.season?.season.name,
      });
    } catch (error) {
      logger.error('Failed to load content', error);
      throw error;
    }
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
    const cost = baseCost * 5 * Math.pow(upgradeMultiplier, currentLevel);
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

export { contentService };
