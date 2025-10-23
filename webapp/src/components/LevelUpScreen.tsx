/**
 * Level Up Screen Component
 * Displays full-screen animated overlay when player levels up
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from './animations/Confetti';
import { useSoundEffect } from '@/hooks/useSoundEffect';

interface LevelUpScreenProps {
  isOpen: boolean;
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
 * <LevelUpScreen
 *   isOpen={true}
 *   newLevel={5}
 *   onDismiss={handleDismiss}
 * />
 */
export const LevelUpScreen: React.FC<LevelUpScreenProps> = ({
  isOpen,
  newLevel,
  onDismiss,
  autoDismissDuration = 2000,
}) => {
  const playSound = useSoundEffect();

  // Play level-up sound and auto-dismiss
  useEffect(() => {
    if (isOpen) {
      playSound('levelup');

      const timer = setTimeout(onDismiss, autoDismissDuration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, playSound, onDismiss, autoDismissDuration]);

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
    <AnimatePresence>
      {isOpen && (
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
                className="relative will-animate"
              >
                {/* Glow effect behind number - enhanced */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-br from-cyan/60 to-lime/60 pointer-events-none will-transform"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: 1,
                  }}
                />

                {/* Rotating star ring effect */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    background:
                      'conic-gradient(from 0deg, rgba(0,217,255,0.8), rgba(72,255,173,0.8), rgba(255,201,87,0.8), transparent)',
                    width: '280px',
                    height: '280px',
                    opacity: 0.3,
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                  } as any}
                />

                {/* Level number */}
                <motion.div
                  className="relative text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan via-lime to-gold drop-shadow-[0_0_30px_rgba(0,217,255,0.8)]"
                  animate={{
                    scale: [1, 1.1, 1],
                    textShadow: [
                      '0 0 20px rgba(0,217,255,0.5)',
                      '0 0 40px rgba(72,255,173,0.8)',
                      '0 0 20px rgba(0,217,255,0.5)',
                    ],
                  }}
                  transition={{
                    duration: 0.8,
                    times: [0, 0.5, 1],
                  }}
                >
                  {newLevel}
                </motion.div>

                {/* Sparkle elements */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{
                      delay: 0.2 + i * 0.1,
                      duration: 0.4,
                    }}
                    style={{
                      left: `${50 + 45 * Math.cos((i * Math.PI) / 4)}%`,
                      top: `${50 + 45 * Math.sin((i * Math.PI) / 4)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <motion.div
                      animate={{
                        opacity: [0.8, 0, 0.8],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 0.3 + i * 0.1,
                      }}
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                ))}
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
                  className="m-0 mt-4 text-body font-semibold text-white/80"
                  variants={textVariants.item}
                >
                  Доступны новые постройки
                </motion.p>
              </motion.div>

              {/* Click to continue hint */}
              <motion.p
                className="m-0 text-caption text-white/50 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Коснитесь для продолжения
              </motion.p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
