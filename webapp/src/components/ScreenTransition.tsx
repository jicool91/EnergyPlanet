/**
 * Screen Transition Component
 * Wraps screen content with fade-in/slide-in animations
 */

import React from 'react';
import { motion, type HTMLMotionProps, type Transition } from 'framer-motion';

type TransitionType = 'fade' | 'slide' | 'slide-right';

type ScreenTransitionProps = HTMLMotionProps<'div'> & {
  type?: TransitionType;
  className?: string;
  children: React.ReactNode;
};

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
  ...rest
}) => {
  type MotionTarget = Exclude<NonNullable<HTMLMotionProps<'div'>['initial']>, boolean>;

  const transitionConfigs: Record<
    TransitionType,
    {
      initial: MotionTarget;
      animate: MotionTarget;
      exit: MotionTarget;
      transition: Transition;
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
      className={className}
      initial={config.initial}
      animate={config.animate}
      exit={config.exit}
      transition={config.transition}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
