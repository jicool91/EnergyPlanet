import { xpThresholdForLevel } from '../level';
import {
  applyTransactionCap,
  calculatePurchaseXp,
  calculateUpgradeXp,
  transactionXpCap,
} from '../xp';

describe('xp transaction helpers', () => {
  it('caps purchase xp to 25% of threshold after diminishing', () => {
    const level = 1200;
    const threshold = xpThresholdForLevel(level);
    const cap = transactionXpCap(level);
    expect(cap).toBe(Math.floor(threshold * 0.25));

    const result = calculatePurchaseXp(25_000_000, level);
    expect(result.rawXp).toBeGreaterThan(0);
    expect(result.appliedXp).toBeLessThanOrEqual(cap);
    expect(result.diminishedXp).toBeLessThanOrEqual(result.rawXp);
  });

  it('applies diminishing returns based on level while respecting per-level cap', () => {
    const early = applyTransactionCap(100_000, 50);
    const late = applyTransactionCap(100_000, 1000);

    expect(early.appliedXp).toBe(transactionXpCap(50));
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
