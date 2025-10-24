import { tapEnergyForLevel, xpFromEnergy } from '../tap';

describe('tap utils', () => {
  test('tap energy grows with level', () => {
    expect(tapEnergyForLevel(0)).toBe(1);
    expect(tapEnergyForLevel(1)).toBeCloseTo(1.15);
    expect(tapEnergyForLevel(5)).toBeCloseTo(1.75);
    expect(tapEnergyForLevel(10)).toBeCloseTo(2.5);
  });

  test('xp from energy scales down', () => {
    expect(xpFromEnergy(0)).toBe(0);
    expect(xpFromEnergy(9)).toBe(0);
    expect(xpFromEnergy(10)).toBe(1);
    expect(xpFromEnergy(95)).toBe(9);
  });
});
