/**
 * Hook for animating number changes
 * Used for energy counter, XP, level displays with smooth transitions
 */

import { useState, useEffect } from 'react';

interface AnimationState {
  displayValue: number;
  isAnimating: boolean;
  deltaValue: number; // Amount changed in last animation
}

/**
 * useNumberAnimation: Animates changes to a number value
 *
 * Usage:
 * const { displayValue, isAnimating, deltaValue } = useNumberAnimation(energy);
 *
 * Features:
 * - Smooth number transition when value changes
 * - Tracks animation state for visual effects (flash, slide-up)
 * - Calculates delta (change amount) for display
 */
export const useNumberAnimation = (targetValue: number, duration: number = 300): AnimationState => {
  const [displayValue, setDisplayValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const [deltaValue, setDeltaValue] = useState(0);
  const [previousValue, setPreviousValue] = useState(targetValue);

  useEffect(() => {
    if (targetValue === previousValue) {
      return;
    }

    // Calculate change
    const delta = targetValue - previousValue;
    setDeltaValue(delta);

    // Trigger animation
    setIsAnimating(true);

    // Animate the display value smoothly
    const startTime = Date.now();
    const startValue = displayValue;

    const animationFrame = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutCubic for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const newValue = startValue + delta * easeProgress;
      setDisplayValue(newValue);

      if (progress >= 1) {
        setDisplayValue(targetValue);
        setIsAnimating(false);
        setPreviousValue(targetValue);
        clearInterval(animationFrame);
      }
    }, 16); // ~60fps

    return () => clearInterval(animationFrame);
  }, [targetValue, previousValue, displayValue, duration]);

  return {
    displayValue: Math.floor(displayValue),
    isAnimating,
    deltaValue,
  };
};
