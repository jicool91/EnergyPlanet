/**
 * Level Up Screen Component
 * Displays full-screen animated overlay when player levels up
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Confetti } from './animations/Confetti';
import { useSoundEffect } from '@/hooks/useSoundEffect';

interface LevelUpScreenProps {
  newLevel: number;
  onDismiss: () => void;
  autoDismissDuration?: number;
}

/**
 * LevelUpScreen: Full-screen level up animation overlay
 *
 * Features:
 * - Full screen darkened background
 * - Animated level number (big bounce)
 * - "Level Up!" text with stagger animation
 * - Confetti burst
 * - Level-up sound (1000Hz, 0.4s)
 * - Auto-dismiss after 2 seconds
 *
 * Example:
 * <LevelUpScreen newLevel={5} onDismiss={handleDismiss} />
 */
export const LevelUpScreen: React.FC<LevelUpScreenProps> = ({
  newLevel,
  onDismiss,
  autoDismissDuration = 2000,
}) => {
  const playSound = useSoundEffect();

  // Play level-up sound and auto-dismiss
  useEffect(() => {
    playSound('levelup');

    const timer = setTimeout(onDismiss, autoDismissDuration);
    return () => clearTimeout(timer);
  }, [playSound, onDismiss, autoDismissDuration]);

  const textVariants = {
    container: {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.3,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: 'easeOut',
        },
      },
    },
  };

  return (
    <>
      {/* Confetti */}
      <Confetti count={50} duration={2.5} />

      {/* Full-screen overlay */}
      <motion.div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onDismiss}
      >
        <div className="flex flex-col items-center gap-6">
          {/* Level number - big bounce */}
          <motion.div
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, y: 50, opacity: 0 }}
            transition={{
              type: 'spring',
              bounce: 0.6,
              duration: 0.8,
            }}
            className="relative"
          >
            {/* Glow effect behind number */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-br from-cyan/40 to-lime/40 pointer-events-none"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: 1,
              }}
            />

            {/* Level number */}
            <motion.div
              className="relative text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan via-lime to-gold drop-shadow-[0_0_30px_rgba(0,217,255,0.6)]"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.8,
                times: [0, 0.5, 1],
              }}
            >
              {newLevel}
            </motion.div>
          </motion.div>

          {/* Text animation with stagger */}
          <motion.div
            className="flex flex-col items-center gap-2 text-center"
            variants={textVariants.container}
            initial="hidden"
            animate="show"
          >
            <motion.h1
              className="m-0 text-5xl font-black text-lime tracking-wider"
              variants={textVariants.item}
            >
              УРОВЕНЬ
            </motion.h1>
            <motion.h1
              className="m-0 text-5xl font-black text-lime tracking-wider"
              variants={textVariants.item}
            >
              ПОВЫШЕН!
            </motion.h1>

            {/* Bonus text */}
            <motion.p
              className="m-0 mt-4 text-lg text-white/80 font-semibold"
              variants={textVariants.item}
            >
              Доступны новые постройки
            </motion.p>
          </motion.div>

          {/* Click to continue hint */}
          <motion.p
            className="m-0 text-sm text-white/50 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Коснитесь для продолжения
          </motion.p>
        </div>
      </motion.div>
    </>
  );
};
