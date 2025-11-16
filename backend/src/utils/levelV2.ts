import { LevelProgress } from './level';

const MAX_LEVEL_V2 = 100;
const MIN_LEVEL = 1;
const ACTION_CAP_RATIO = 0.2;

const XP_ANCHORS = [
  { level: 1, xp: 255 },
  { level: 10, xp: 1452 },
  { level: 30, xp: 8943 },
  { level: 60, xp: 23912 },
  { level: 90, xp: 49623 },
  { level: 100, xp: 70002 },
];

const xpCache = new Map<number, number>();
const cumulativeCache = new Map<number, number>();

function normalizedLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return MIN_LEVEL;
  }
  return Math.min(MAX_LEVEL_V2, Math.max(MIN_LEVEL, Math.floor(level)));
}

function findAnchorIndex(level: number): number {
  return XP_ANCHORS.findIndex(anchor => level <= anchor.level);
}

function interpolateXp(level: number): number {
  const idx = findAnchorIndex(level);
  if (idx === -1) {
    return XP_ANCHORS[XP_ANCHORS.length - 1].xp;
  }
  const upper = XP_ANCHORS[idx];
  if (upper.level === level || idx === 0) {
    return upper.xp;
  }
  const lower = XP_ANCHORS[idx - 1];
  const levelRatio = level / lower.level;
  const exponent = Math.log(upper.xp / lower.xp) / Math.log(upper.level / lower.level);
  const value = lower.xp * Math.pow(levelRatio, exponent);
  return Math.round(value);
}

export function xpThresholdForLevelV2(level: number): number {
  const safeLevel = normalizedLevel(level);
  if (xpCache.has(safeLevel)) {
    return xpCache.get(safeLevel)!;
  }
  const value = interpolateXp(safeLevel);
  xpCache.set(safeLevel, value);
  return value;
}

export function cumulativeXpToLevel(level: number): number {
  const safeLevel = normalizedLevel(level);
  if (cumulativeCache.has(safeLevel)) {
    return cumulativeCache.get(safeLevel)!;
  }
  let cumulative = 0;
  for (let current = MIN_LEVEL; current <= safeLevel; current += 1) {
    cumulative += xpThresholdForLevelV2(current);
  }
  cumulativeCache.set(safeLevel, cumulative);
  return cumulative;
}

export function xpCapForAction(level: number): number {
  return Math.floor(xpThresholdForLevelV2(level) * ACTION_CAP_RATIO);
}

export function calculateLevelProgressV2(totalXp: number): LevelProgress {
  const clampedTotal = Math.max(0, Math.floor(totalXp));
  let accumulated = 0;
  let level = MIN_LEVEL;
  for (; level < MAX_LEVEL_V2; level += 1) {
    const threshold = xpThresholdForLevelV2(level);
    if (accumulated + threshold > clampedTotal) {
      const xpIntoLevel = clampedTotal - accumulated;
      return {
        level,
        xpIntoLevel,
        xpForNextLevel: threshold,
        xpToNextLevel: Math.max(0, threshold - xpIntoLevel),
      };
    }
    accumulated += threshold;
  }
  // Cap reached
  const capThreshold = xpThresholdForLevelV2(MAX_LEVEL_V2);
  return {
    level: MAX_LEVEL_V2,
    xpIntoLevel: Math.min(clampedTotal - cumulativeXpToLevel(MAX_LEVEL_V2 - 1), capThreshold),
    xpForNextLevel: capThreshold,
    xpToNextLevel: 0,
  };
}

export { MAX_LEVEL_V2 };
