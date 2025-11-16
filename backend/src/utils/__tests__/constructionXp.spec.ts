import { describe, expect, it } from '@jest/globals';
import { calculateConstructionXpReward } from '../constructionXp';

describe('construction XP reward', () => {
  it('scales with tier and duration', () => {
    const quickJob = calculateConstructionXpReward({
      tier: 1,
      durationMinutes: 5,
      buildingLevel: 0,
      playerLevel: 10,
    });
    const longJob = calculateConstructionXpReward({
      tier: 3,
      durationMinutes: 150,
      buildingLevel: 3,
      playerLevel: 40,
    });
    expect(longJob.rawXp).toBeGreaterThan(quickJob.rawXp);
    expect(longJob.appliedXp).toBeLessThanOrEqual(longJob.cap);
  });

  it('caps xp by player level', () => {
    const result = calculateConstructionXpReward({
      tier: 4,
      durationMinutes: 600,
      buildingLevel: 5,
      playerLevel: 5,
    });
    expect(result.appliedXp).toBe(result.cap);
  });
});
