export function tapEnergyForLevel(tapLevel: number): number {
  const level = Math.max(1, tapLevel);
  const base = 1;
  const multiplier = 1 + (level - 1) * 0.25;
  return base * multiplier;
}

export function xpFromEnergy(energy: number): number {
  return Math.floor(energy / 10);
}
