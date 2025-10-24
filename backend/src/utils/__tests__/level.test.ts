import { calculateLevelProgress, xpThresholdForLevel } from '../level';

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
    expect(lateGame.xpForNextLevel).toBe(xpThresholdForLevel(lateGame.level));
  });

  it('applies soft caps for higher levels', () => {
    const xpAt100 = xpThresholdForLevel(100);
    expect(xpAt100).toBe(100_000);

    const xpAt150 = xpThresholdForLevel(150);
    expect(xpAt150).toBe(xpAt100 + 10_000 * 50);

    const xpAt1000 = xpThresholdForLevel(1000);
    expect(xpAt1000).toBe(xpAt100 + 10_000 * 900);

    const xpAt1500 = xpThresholdForLevel(1500);
    expect(xpAt1500).toBe(xpAt1000 + 50_000 * 500);
  });
});
