const BASE_XP_MULTIPLIER = 100;
const BASE_EXPONENT = 1.5;
const MID_SOFT_CAP_LEVEL = 100;
const HIGH_SOFT_CAP_LEVEL = 1000;
const MID_INCREMENT = 10_000;
const HIGH_INCREMENT = 50_000;

const XP_AT_MID_SOFT_CAP = Math.round(
  BASE_XP_MULTIPLIER * Math.pow(MID_SOFT_CAP_LEVEL, BASE_EXPONENT)
);
const XP_AT_HIGH_SOFT_CAP = XP_AT_MID_SOFT_CAP + MID_INCREMENT * (HIGH_SOFT_CAP_LEVEL - MID_SOFT_CAP_LEVEL);

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
}

export function xpThresholdForLevel(level: number): number {
  const normalizedLevel = Math.max(1, Math.floor(level));

  if (normalizedLevel <= MID_SOFT_CAP_LEVEL) {
    return Math.round(BASE_XP_MULTIPLIER * Math.pow(normalizedLevel, BASE_EXPONENT));
  }

  if (normalizedLevel <= HIGH_SOFT_CAP_LEVEL) {
    return XP_AT_MID_SOFT_CAP + MID_INCREMENT * (normalizedLevel - MID_SOFT_CAP_LEVEL);
  }

  return (
    XP_AT_HIGH_SOFT_CAP + HIGH_INCREMENT * (normalizedLevel - HIGH_SOFT_CAP_LEVEL)
  );
}

export function calculateLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let xpRemaining = Math.max(0, Math.floor(totalXp));
  let xpForNextLevel = xpThresholdForLevel(level);

  while (xpRemaining >= xpForNextLevel) {
    xpRemaining -= xpForNextLevel;
    level += 1;
    xpForNextLevel = xpThresholdForLevel(level);
  }

  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel,
    xpToNextLevel: Math.max(0, xpForNextLevel - xpRemaining),
  };
}
