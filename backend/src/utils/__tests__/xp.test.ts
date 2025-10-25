import { xpThresholdForLevel } from '../level';
import {
  applyTransactionCap,
  calculatePurchaseXp,
  calculateUpgradeXp,
  transactionXpCap,
} from '../xp';

describe('xp transaction helpers', () => {
  it('applies tiered transaction cap ratios by level band', () => {
    const levelEarly = 50;
    const levelMid = 200;
    const levelLate = 800;

    expect(transactionXpCap(levelEarly)).toBe(
      Math.floor(xpThresholdForLevel(levelEarly) * 0.4)
    );
    expect(transactionXpCap(levelMid)).toBe(
      Math.floor(xpThresholdForLevel(levelMid) * 0.33)
    );
    expect(transactionXpCap(levelLate)).toBe(
      Math.floor(xpThresholdForLevel(levelLate) * 0.25)
    );
  });

  it('caps purchase xp after applying diminishing returns', () => {
    const level = 500;
    const cap = transactionXpCap(level);

    const result = calculatePurchaseXp(25_000_000, level);
    expect(result.rawXp).toBeGreaterThan(result.appliedXp);
    expect(result.appliedXp).toBeLessThanOrEqual(cap);
    expect(result.diminishedXp).toBeLessThanOrEqual(result.rawXp);
  });

  it('applies diminishing returns based on level while respecting per-level cap', () => {
    const early = applyTransactionCap(100_000, 50);
    const late = applyTransactionCap(100_000, 1000);

    expect(early.appliedXp).toBeLessThanOrEqual(transactionXpCap(50));
    expect(early.appliedXp).toBeGreaterThan(0);
    expect(late.appliedXp).toBeLessThanOrEqual(transactionXpCap(1000));
    expect(late.appliedXp).toBeLessThan(late.rawXp);
  });

  it('reduces upgrade xp more aggressively than purchases', () => {
    const level = 500;
    const purchase = calculatePurchaseXp(100_000_000, level);
    const upgrade = calculateUpgradeXp(100_000_000, level);
    expect(upgrade.appliedXp).toBeLessThanOrEqual(purchase.appliedXp);
  });
});
