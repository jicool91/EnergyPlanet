/**
 * Hook for detecting device capabilities
 * Used to optimize animations based on device performance
 */

import { useMemo } from 'react';

interface DeviceCapabilities {
  isLowEnd: boolean;      // Low-end device (limit animations)
  isHighEnd: boolean;     // High-end device (full effects)
  supportsGPU: boolean;   // GPU acceleration available
  maxParticles: number;   // Max confetti particles
  reduceMotion: boolean;  // User prefers reduced motion
}

/**
 * useDeviceCapabilities: Detects device performance capabilities
 *
 * Returns:
 * - isLowEnd: true if device is low-performance
 * - isHighEnd: true if device is high-performance
 * - supportsGPU: true if GPU acceleration available
 * - maxParticles: recommended max particles for confetti
 * - reduceMotion: user prefers reduced motion (accessibility)
 */
export const useDeviceCapabilities = (): DeviceCapabilities => {
  return useMemo(() => {
    // Check for reduced motion preference (accessibility)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect device type and capabilities
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    const isIOS = ua.includes('iphone') || ua.includes('ipad');
    const isMobile = isAndroid || isIOS;

    // Get device memory if available (Chrome)
    const deviceMemory = (navigator as any).deviceMemory || 8;

    // Estimate GPU support
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as any);
    const supportsGPU = gl !== null && gl !== undefined;

    // Determine device tier
    let isLowEnd = false;
    let isHighEnd = false;
    let maxParticles = 30;

    if (isMobile) {
      // Mobile device
      if (deviceMemory <= 2) {
        // Very low-end (old phones)
        isLowEnd = true;
        maxParticles = 10;
      } else if (deviceMemory <= 4) {
        // Low-mid range
        isLowEnd = true;
        maxParticles = 20;
      } else if (deviceMemory >= 8) {
        // High-end
        isHighEnd = true;
        maxParticles = 50;
      }
    } else {
      // Desktop device
      isHighEnd = true;
      maxParticles = 50;
    }

    // Reduce particles if GPU not available
    if (!supportsGPU) {
      maxParticles = Math.max(10, maxParticles / 2);
    }

    // Further reduce if user prefers reduced motion
    if (prefersReducedMotion) {
      maxParticles = maxParticles / 2;
      isLowEnd = true;
    }

    return {
      isLowEnd,
      isHighEnd,
      supportsGPU,
      maxParticles: Math.floor(maxParticles),
      reduceMotion: prefersReducedMotion,
    };
  }, []);
};
