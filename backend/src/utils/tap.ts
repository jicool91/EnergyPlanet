export function tapEnergyForLevel(tapLevel: number): number {
  const level = Math.max(0, tapLevel);
  const base = 1;
  const multiplier = 1 + level * 0.15;
  return base * multiplier;
}

export function xpFromEnergy(energy: number): number {
  return Math.floor(energy / 10);
}
