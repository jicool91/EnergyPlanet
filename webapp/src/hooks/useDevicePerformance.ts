import { useMemo } from 'react';

export type DevicePerformanceTier = 'low' | 'medium' | 'high';

function detectPerformanceTier(): DevicePerformanceTier {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'medium';
  }

  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const connection = (navigator as unknown as { connection?: { effectiveType?: string } })
    .connection;
  const effectiveType = connection?.effectiveType ?? '';
  const userAgent = navigator.userAgent.toLowerCase();

  const lowEndBrands = ['moto g', 'redmi', 'a50', 'a10', 'j2 prime', 'galaxy j', 'iphone se'];
  const isKnownLowEnd = lowEndBrands.some(brand => userAgent.includes(brand));

  if (
    cores <= 2 ||
    memory <= 2 ||
    effectiveType.includes('2g') ||
    effectiveType.includes('slow-2g') ||
    isKnownLowEnd
  ) {
    return 'low';
  }

  const isHighEnd = cores >= 8 && memory >= 6;
  return isHighEnd ? 'high' : 'medium';
}

export function useDevicePerformance(): DevicePerformanceTier {
  return useMemo(() => detectPerformanceTier(), []);
}

export const devicePerformance = {
  detect: detectPerformanceTier,
};
