import { calculateLevelProgress } from '../level';

describe('calculateLevelProgress', () => {
  test('level 1 baseline', () => {
    const result = calculateLevelProgress(0);
    expect(result.level).toBe(1);
    expect(result.xpIntoLevel).toBe(0);
    expect(result.xpForNextLevel).toBe(100);
    expect(result.xpToNextLevel).toBe(100);
  });

  test('levels up correctly', () => {
    const result = calculateLevelProgress(350);
    expect(result.level).toBe(3);
    expect(result.xpIntoLevel).toBe(50);
    expect(result.xpToNextLevel).toBe(250);
  });
});
