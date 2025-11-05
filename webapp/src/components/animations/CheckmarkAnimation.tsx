/**
 * Animated Checkmark Component
 * Draws a checkmark with SVG stroke animation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';

interface CheckmarkAnimationProps {
  size?: number;
  color?: string;
  duration?: number;
}

/**
 * CheckmarkAnimation: Draws checkmark with animated SVG stroke
 * Creates professional looking animated checkmark for success states
 */
export const CheckmarkAnimation: React.FC<CheckmarkAnimationProps> = ({
  size = 80,
  color = '#00ff88', // lime neon (2025 palette)
  duration = 0.6,
}) => {
  const reduceMotion = useAppReducedMotion();

  if (reduceMotion) {
    return (
      <div className="flex items-center justify-center" aria-hidden>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="2" fill="none" />
          <path
            d="M 30 50 L 45 65 L 75 35"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
      className="flex items-center justify-center"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circle background */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Checkmark path */}
        <motion.path
          d="M 30 50 L 45 65 L 75 35"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration, delay: 0.2, ease: 'easeInOut' }}
        />
      </svg>
    </motion.div>
  );
};
