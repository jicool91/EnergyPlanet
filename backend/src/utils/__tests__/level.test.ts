import { calculateLevelProgress } from '../level';

describe('calculateLevelProgress', () => {
  it('returns base level data for new players', () => {
    const progress = calculateLevelProgress(0);
    expect(progress).toEqual({
      level: 1,
      xpIntoLevel: 0,
      xpForNextLevel: 100,
      xpToNextLevel: 100,
    });
  });

  it('tracks level ups using exponential thresholds', () => {
    const afterFirstLevel = calculateLevelProgress(100);
    expect(afterFirstLevel.level).toBe(2);
    expect(afterFirstLevel.xpIntoLevel).toBe(0);
    expect(afterFirstLevel.xpForNextLevel).toBe(283);
    expect(afterFirstLevel.xpToNextLevel).toBe(283);

    const midGame = calculateLevelProgress(2000);
    expect(midGame.level).toBe(5);
    expect(midGame.xpIntoLevel).toBeGreaterThan(0);
    expect(midGame.xpForNextLevel).toBe(1118);
    expect(midGame.xpIntoLevel + midGame.xpToNextLevel).toBe(midGame.xpForNextLevel);
  });

  it('handles large xp totals without overflow', () => {
    const lateGame = calculateLevelProgress(150_000);
    expect(lateGame.level).toBeGreaterThan(10);
    expect(lateGame.xpForNextLevel).toBe(Math.round(100 * Math.pow(lateGame.level, 1.5)));
  });
});
