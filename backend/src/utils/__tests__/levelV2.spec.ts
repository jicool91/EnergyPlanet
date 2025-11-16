import { describe, expect, it } from '@jest/globals';
import {
  xpThresholdForLevelV2,
  cumulativeXpToLevel,
  xpCapForAction,
  calculateLevelProgressV2,
  MAX_LEVEL_V2,
} from '../levelV2';

describe('levelV2 curve', () => {
  it('returns deterministic xp thresholds', () => {
    expect(xpThresholdForLevelV2(1)).toBe(255);
    expect(xpThresholdForLevelV2(10)).toBe(1452);
    expect(xpThresholdForLevelV2(30)).toBe(8943);
    expect(xpThresholdForLevelV2(60)).toBe(23912);
    expect(xpThresholdForLevelV2(100)).toBe(70002);
  });

  it('calculates cumulative xp correctly', () => {
    expect(cumulativeXpToLevel(10)).toBe(8973);
    expect(cumulativeXpToLevel(60)).toBe(598042);
    expect(cumulativeXpToLevel(100)).toBe(2297631);
  });

  it('limits xp cap per action to 20%', () => {
    expect(xpCapForAction(10)).toBe(Math.floor(1452 * 0.2));
  });

  it('stops level at max cap', () => {
    const summary = calculateLevelProgressV2(999999999);
    expect(summary.level).toBe(MAX_LEVEL_V2);
    expect(summary.xpToNextLevel).toBe(0);
  });
});
