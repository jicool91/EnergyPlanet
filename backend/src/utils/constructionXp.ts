import { xpCapForAction, xpThresholdForLevelV2 } from './levelV2';

export type ConstructionTier = 1 | 2 | 3 | 4;

const TIER_XP: Record<ConstructionTier, number> = {
  1: 40,
  2: 90,
  3: 220,
  4: 550,
};

export interface ConstructionXpInput {
  tier: ConstructionTier;
  durationMinutes: number;
  buildingLevel: number;
  playerLevel: number;
  qualityMultiplier?: number;
}

export interface ConstructionXpResult {
  rawXp: number;
  appliedXp: number;
  cap: number;
}

function clampQuality(multiplier: number | undefined): number {
  if (!Number.isFinite(multiplier)) {
    return 1;
  }
  const safeMultiplier = multiplier as number;
  return Math.min(1.15, Math.max(0.8, safeMultiplier));
}

export function calculateConstructionXpReward(input: ConstructionXpInput): ConstructionXpResult {
  const tierXp = TIER_XP[input.tier];
  const safeDuration = Math.max(1, input.durationMinutes);
  const quality = clampQuality(input.qualityMultiplier);
  const buildingFactor = 1 + Math.max(0, input.buildingLevel) * 0.05;
  const raw = tierXp * Math.sqrt(safeDuration) * buildingFactor * quality;
  const cap = xpCapForAction(input.playerLevel);
  const applied = Math.min(Math.round(raw), cap);
  return {
    rawXp: Math.round(raw),
    appliedXp: cap > 0 ? applied : Math.max(0, Math.round(raw)),
    cap,
  };
}

export function projectedLevelsFromXp(currentLevel: number, xpGain: number): number {
  const threshold = xpThresholdForLevelV2(currentLevel);
  if (threshold <= 0) {
    return currentLevel;
  }
  const cappedXp = Math.min(threshold, xpGain);
  return cappedXp >= threshold ? currentLevel + 1 : currentLevel;
}
