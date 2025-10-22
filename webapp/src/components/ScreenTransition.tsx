/**
 * Screen Transition Component
 * Wraps screen content with fade-in/slide-in animations
 */

import React from 'react';
import { motion } from 'framer-motion';

type TransitionType = 'fade' | 'slide' | 'slide-right';

interface ScreenTransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  className?: string;
  key?: string | number;
}

/**
 * ScreenTransition: Wraps screen with animated entrance
 *
 * Transition types:
 * - 'fade': Simple fade-in (0.3s)
 * - 'slide': Slide-up from bottom (0.4s)
 * - 'slide-right': Slide from right (0.4s) - for modals
 *
 * Example:
 * <ScreenTransition type="fade">
 *   <YourScreenContent />
 * </ScreenTransition>
 */
export const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  children,
  type = 'fade',
  className = '',
  key,
}) => {
  const transitionConfigs: Record<
    TransitionType,
    {
      initial: any;
      animate: any;
      exit: any;
      transition: any;
    }
  > = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    slide: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 20, opacity: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    'slide-right': {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  const config = transitionConfigs[type];

  return (
    <motion.div
      key={key}
      className={className}
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
    >
      {children}
    </motion.div>
  );
};
