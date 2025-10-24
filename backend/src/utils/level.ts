export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
}

function xpRequiredForLevel(level: number): number {
  const normalizedLevel = Math.max(1, level);
  return Math.round(100 * Math.pow(normalizedLevel, 1.5));
}

export function calculateLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let xpRemaining = Math.max(0, Math.floor(totalXp));
  let xpForNextLevel = xpRequiredForLevel(level);

  while (xpRemaining >= xpForNextLevel) {
    xpRemaining -= xpForNextLevel;
    level += 1;
    xpForNextLevel = xpRequiredForLevel(level);
  }

  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel,
    xpToNextLevel: Math.max(0, xpForNextLevel - xpRemaining),
  };
}
