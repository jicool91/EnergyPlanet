export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
}

export function calculateLevelProgress(totalXp: number): LevelProgress {
  let level = 1;
  let xpRemaining = Math.max(0, Math.floor(totalXp));
  let xpForNextLevel = level * 100;

  while (xpRemaining >= xpForNextLevel) {
    xpRemaining -= xpForNextLevel;
    level += 1;
    xpForNextLevel = level * 100;
  }

  return {
    level,
    xpIntoLevel: xpRemaining,
    xpForNextLevel,
    xpToNextLevel: Math.max(0, xpForNextLevel - xpRemaining),
  };
}
