/**
 * Hook for animating number changes
 * Used for energy counter, XP, level displays with smooth transitions
 */

import { useState, useEffect, useRef, useEffectEvent } from 'react';

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
  const previousValueRef = useRef(targetValue);
  const animationFrameRef = useRef<number | null>(null);

  const runAnimation = useEffectEvent((from: number, to: number) => {
    const startValue = displayValue;
    const delta = to - from;
    const valueDelta = to - startValue;
    setDeltaValue(delta);
    setIsAnimating(true);

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + valueDelta * easeProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      animationFrameRef.current = null;
      setDisplayValue(to);
      setIsAnimating(false);
    };

    animationFrameRef.current = requestAnimationFrame(step);
  });

  useEffect(() => {
    const from = previousValueRef.current;
    if (targetValue === from) {
      return () => undefined;
    }

    runAnimation(from, targetValue);
    previousValueRef.current = targetValue;

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [targetValue]);

  return {
    displayValue: Math.floor(displayValue),
    isAnimating,
    deltaValue,
  };
};
