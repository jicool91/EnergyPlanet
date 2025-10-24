import { computePassiveIncome, type BuildingDetail } from '../passiveIncome';
import type { BoostRecord } from '../../repositories/BoostRepository';

describe('computePassiveIncome', () => {
  const mockBuilding = (income: number): BuildingDetail => ({
    building_id: 'mock',
    name: 'Mock',
    count: 1,
    level: 1,
    income_per_sec: income,
    next_cost: 0,
    next_upgrade_cost: 0,
  });

  const mockBoost = (multiplier: number): BoostRecord => ({
    id: 'boost',
    userId: 'user',
    boostType: 'mock',
    multiplier,
    expiresAt: new Date(Date.now() + 60_000),
    createdAt: new Date(),
  });

  it('aggregates base income and boost multipliers', () => {
    const snapshot = computePassiveIncome(
      [mockBuilding(100), mockBuilding(55.5)],
      [mockBoost(1.5), mockBoost(1.1)]
    );

    expect(snapshot.baseIncome).toBeCloseTo(155.5);
    expect(snapshot.boostMultiplier).toBeCloseTo(1.65);
    expect(snapshot.effectiveIncome).toBeCloseTo(256.575);
  });

  it('defaults boost multiplier to 1 without active boosts', () => {
    const snapshot = computePassiveIncome([mockBuilding(42)], []);

    expect(snapshot.baseIncome).toBe(42);
    expect(snapshot.boostMultiplier).toBe(1);
    expect(snapshot.effectiveIncome).toBe(42);
  });
});
