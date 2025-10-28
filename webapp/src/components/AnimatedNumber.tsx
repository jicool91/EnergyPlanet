/**
 * Animated Number Display Component
 * Shows animated changes to numbers with slide-up and color flash effects
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useNumberAnimation } from '@/hooks/useNumberAnimation';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
  showDelta?: boolean; // Show "+X" or "-X" next to number
  deltaClassName?: string;
  formatter?: (value: number) => string;
  deltaFormatter?: (value: number) => string;
}

/**
 * AnimatedNumber: Displays a number with animation on change
 *
 * Features:
 * - Smooth number transition
 * - Color flash on increase (yellow → green → yellow)
 * - Slide-up animation on change
 * - Optional delta display ("+500", "-100")
 *
 * Example:
 * <AnimatedNumber value={energy} className="text-2xl text-cyan font-bold" />
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  className = '',
  duration = 300,
  showDelta = false,
  deltaClassName = 'text-sm text-lime',
  formatter,
  deltaFormatter,
}) => {
  const { displayValue, isAnimating, deltaValue } = useNumberAnimation(value, duration);
  const mainFormatter = formatter ?? ((val: number) => val.toLocaleString());
  const appliedDeltaFormatter =
    deltaFormatter ??
    formatter ??
    ((val: number) => (val > 0 ? `+${val.toLocaleString()}` : val.toLocaleString()));
  const deltaTone = deltaValue === 0 ? '' : deltaValue > 0 ? 'text-lime' : 'text-red-error';

  return (
    <div className="relative inline-block">
      {/* Main number with animation */}
      <motion.div
        key={`${displayValue}`}
        className={className}
        initial={isAnimating ? { y: 0, opacity: 1 } : undefined}
        animate={isAnimating ? { y: -10, opacity: 0.7 } : undefined}
        transition={{ duration: 0.3 }}
      >
        {mainFormatter(displayValue)}
      </motion.div>

      {/* Color flash effect on increase */}
      {isAnimating && deltaValue > 0 && (
        <motion.div
          className={`absolute inset-0 ${className}`}
          style={{ color: '#00ff88' }} // neon lime (Phase 2 palette)
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.4, times: [0, 0.5, 1] }}
        >
          {mainFormatter(displayValue)}
        </motion.div>
      )}

      {/* Delta indicator (+X or -X) */}
      {showDelta && deltaValue !== 0 && isAnimating && (
        <motion.div
          className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap ${deltaClassName} ${deltaTone}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.3 }}
        >
          {appliedDeltaFormatter(deltaValue)}
        </motion.div>
      )}
    </div>
  );
};
