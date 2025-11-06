/**
 * Reusable animation wrapper component using Framer Motion
 * Wraps content with common animation patterns
 */

import React from 'react';
import clsx from 'clsx';
import { motion, type MotionProps, type Transition } from 'framer-motion';
import { useAppReducedMotion } from '@/hooks/useAppReducedMotion';

type AnimationType =
  | 'fadeIn'
  | 'fadeInUp'
  | 'scaleIn'
  | 'slideInRight'
  | 'slideInLeft'
  | 'bounceIn';

interface AnimationWrapperProps extends MotionProps {
  children: React.ReactNode;
  type?: AnimationType;
  className?: string;
}

type MotionTarget = Exclude<MotionProps['initial'], boolean | undefined>;

const animationConfigs: Record<
  AnimationType,
  {
    initial: MotionTarget;
    animate: MotionTarget;
    exit: MotionTarget;
    transition: Transition;
  }
> = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3 },
  },
  scaleIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { duration: 0.4, type: 'spring' as const, stiffness: 200 },
  },
  slideInRight: {
    initial: { x: 300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 300, opacity: 0 },
    transition: { duration: 0.4 },
  },
  slideInLeft: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 },
    transition: { duration: 0.4 },
  },
  bounceIn: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: { duration: 0.6, type: 'spring' as const, bounce: 0.5 },
  },
};

/**
 * Main animation wrapper - applies pre-configured animations
 */
export const AnimationWrapper: React.FC<AnimationWrapperProps> = ({
  children,
  type = 'fadeIn',
  className = '',
  ...props
}) => {
  const config = animationConfigs[type];
  const reduceMotion = useAppReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? undefined : config.initial}
      animate={reduceMotion ? undefined : config.animate}
      exit={reduceMotion ? undefined : config.exit}
      transition={reduceMotion ? undefined : config.transition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Glow effect wrapper - adds cyan glow animation
 */
export const GlowWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const reduceMotion = useAppReducedMotion();

  return (
    <motion.div
      className={clsx(
        className,
        reduceMotion ? undefined : 'transition-shadow duration-300 hover:shadow-glow'
      )}
    >
      {children}
    </motion.div>
  );
};

/**
 * Tap effect wrapper - scales down on tap
 */
export const TapWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const reduceMotion = useAppReducedMotion();

  return (
    <motion.div
      className={className}
      whileTap={reduceMotion ? undefined : { scale: 0.95 }}
      transition={reduceMotion ? undefined : { type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger container for list animations
 */
export const StaggerContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}> = ({ children, className = '', delayChildren = 0, staggerChildren = 0.1 }) => {
  const reduceMotion = useAppReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Stagger item - child of StaggerContainer
 */
export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  const reduceMotion = useAppReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
        },
      }}
    >
      {children}
    </motion.div>
  );
};
