/**
 * Hook for detecting device capabilities
 * Used to optimize animations based on device performance
 */

import { useMemo } from 'react';
import { usePreferencesStore } from '@/store/preferencesStore';

interface DeviceCapabilities {
  isLowEnd: boolean; // Low-end device (limit animations)
  isHighEnd: boolean; // High-end device (full effects)
  supportsGPU: boolean; // GPU acceleration available
  maxParticles: number; // Max confetti particles
  reduceMotion: boolean; // User prefers reduced motion
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
  const reduceMotionPreference = usePreferencesStore(state => state.reduceMotion);
  interface NavigatorWithMemory extends Navigator {
    deviceMemory?: number;
  }

  return useMemo(() => {
    // Check for reduced motion preference (accessibility)
    const prefersReducedMotion =
      reduceMotionPreference ||
      (typeof window !== 'undefined'
        ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
        : false);

    // Detect device type and capabilities
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isAndroid = ua.includes('android');
    const isIOS = ua.includes('iphone') || ua.includes('ipad');
    const isMobile = isAndroid || isIOS;

    // Get device memory if available (Chrome)
    const deviceMemory =
      typeof navigator !== 'undefined' ? ((navigator as NavigatorWithMemory).deviceMemory ?? 8) : 8;

    // Estimate GPU support
    const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
    const gl = canvas
      ? canvas.getContext('webgl') ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
      : null;
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
  }, [reduceMotionPreference]);
};
