/**
 * Level Up Screen Component
 * Displays full-screen animated overlay when player levels up
 */

import { useCallback, useEffect, useMemo, useRef, type CSSProperties } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Confetti } from './animations/Confetti';
import { useSoundEffect } from '@/hooks/useSoundEffect';
import { usePreferencesStore } from '@/store/preferencesStore';

interface LevelUpScreenProps {
  isOpen: boolean;
  newLevel: number;
  onDismiss: () => void;
  autoDismissDuration?: number | null;
}

/**
 * LevelUpScreen: Full-screen level up animation overlay
 *
 * Features:
 * - Full screen darkened background
 * - Animated level number (big bounce)
 * - "Level Up!" text with stagger animation
 * - Confetti burst
 * - Level-up sound (1000Hz, 0.4s) respecting sound settings
 * - Optional auto-dismiss (disabled by default)
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
  autoDismissDuration = null,
}) => {
  const playSound = useSoundEffect();
  const soundEnabled = usePreferencesStore(state => state.soundEnabled);
  const reduceMotionPreference = usePreferencesStore(state => state.reduceMotion);
  const systemPrefersReducedMotion = useReducedMotion();
  const prefersReducedMotion = Boolean(systemPrefersReducedMotion || reduceMotionPreference);

  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);

  // Play level-up sound when open, respecting user preference
  useEffect(() => {
    if (isOpen && soundEnabled) {
      playSound('levelup');
    }
  }, [isOpen, soundEnabled, playSound]);

  // Manage focus entry/exit for accessibility
  useEffect(() => {
    if (isOpen) {
      lastFocusedElementRef.current = document.activeElement as HTMLElement | null;
      const focusTimer = window.setTimeout(() => {
        primaryActionRef.current?.focus();
      }, 0);

      return () => window.clearTimeout(focusTimer);
    }

    if (!isOpen && lastFocusedElementRef.current) {
      lastFocusedElementRef.current.focus();
      lastFocusedElementRef.current = null;
    }
  }, [isOpen]);

  // Optional auto-dismiss if explicitly provided
  useEffect(() => {
    if (!isOpen || autoDismissDuration == null) {
      return;
    }

    const timer = window.setTimeout(onDismiss, autoDismissDuration);
    return () => window.clearTimeout(timer);
  }, [isOpen, autoDismissDuration, onDismiss]);

  const focusTrapHandler = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!dialogRef.current) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const isShiftPressed = event.shiftKey;
      const activeElement = document.activeElement as HTMLElement | null;

      if (!isShiftPressed && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      } else if (isShiftPressed && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    },
    [onDismiss]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onDismiss();
      }
    },
    [onDismiss]
  );

  const rotatingRingStyle: CSSProperties = {
    background:
      'conic-gradient(from 0deg, rgba(0,217,255,0.8), rgba(72,255,173,0.8), rgba(255,201,87,0.8), transparent)',
    width: '280px',
    height: '280px',
    opacity: 0.3,
    filter: 'blur(2px)',
    pointerEvents: 'none',
  };

  const textVariants = useMemo(
    () => ({
      container: {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: prefersReducedMotion ? 0 : 0.1,
            delayChildren: prefersReducedMotion ? 0 : 0.3,
          },
        },
      },
      item: {
        hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: prefersReducedMotion ? 0.2 : 0.4,
            ease: 'easeOut',
          },
        },
      },
    }),
    [prefersReducedMotion]
  );

  const levelNumberAnimation = prefersReducedMotion
    ? { scale: 1, textShadow: '0 0 20px rgba(0,217,255,0.5)' }
    : {
        scale: [1, 1.1, 1],
        textShadow: [
          '0 0 20px rgba(0,217,255,0.5)',
          '0 0 40px rgba(72,255,173,0.8)',
          '0 0 20px rgba(0,217,255,0.5)',
        ],
      };

  const glowAnimation = prefersReducedMotion
    ? { opacity: 0.8, scale: 1 }
    : {
        scale: [1, 1.3, 1],
        opacity: [0.6, 1, 0.6],
      };

  const glowTransition = prefersReducedMotion
    ? { duration: 0.3, repeat: 0 as const }
    : { duration: 1.2, repeat: 1 as const };

  const sparkleTransition = prefersReducedMotion
    ? { duration: 0.2 }
    : { duration: 1.5, repeat: Infinity as const };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!prefersReducedMotion && <Confetti count={50} duration={2.5} />}

          <motion.div
            ref={dialogRef}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[2000]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            onClick={handleOverlayClick}
            onKeyDown={focusTrapHandler}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="levelup-title"
            aria-describedby="levelup-message"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                initial={{
                  scale: prefersReducedMotion ? 1 : 0,
                  y: prefersReducedMotion ? 0 : 50,
                  opacity: 0,
                }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0, y: 50, opacity: 0 }}
                transition={{
                  type: prefersReducedMotion ? 'tween' : 'spring',
                  bounce: prefersReducedMotion ? 0 : 0.6,
                  duration: prefersReducedMotion ? 0.3 : 0.8,
                }}
                className="relative will-animate"
              >
                <motion.div
                  className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-br from-cyan/60 to-lime/60 pointer-events-none will-transform"
                  animate={glowAnimation}
                  transition={glowTransition}
                />

                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={prefersReducedMotion ? { opacity: 0.3 } : { rotate: 360 }}
                  transition={
                    prefersReducedMotion
                      ? undefined
                      : {
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }
                  }
                  style={rotatingRingStyle}
                />

                <motion.div
                  className="relative text-hero-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan via-lime to-gold drop-shadow-[0_0_30px_rgba(0,217,255,0.8)]"
                  animate={levelNumberAnimation}
                  transition={{
                    duration: prefersReducedMotion ? 0.3 : 0.8,
                    times: [0, 0.5, 1],
                  }}
                >
                  {newLevel}
                </motion.div>

                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-3xl"
                    initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0 }}
                    transition={{
                      delay: prefersReducedMotion ? 0 : 0.2 + i * 0.1,
                      duration: prefersReducedMotion ? 0.2 : 0.4,
                    }}
                    style={{
                      left: `${50 + 45 * Math.cos((i * Math.PI) / 4)}%`,
                      top: `${50 + 45 * Math.sin((i * Math.PI) / 4)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <motion.div
                      animate={{
                        opacity: prefersReducedMotion ? 1 : [0.8, 0, 0.8],
                        scale: prefersReducedMotion ? 1 : [1, 1.3, 1],
                      }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : {
                              ...sparkleTransition,
                              delay: 0.3 + i * 0.1,
                            }
                      }
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                className="flex flex-col items-center gap-2 text-center"
                variants={textVariants.container}
                initial="hidden"
                animate="show"
                id="levelup-title"
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

                <motion.p
                  className="m-0 mt-4 text-body font-semibold text-token-secondary"
                  variants={textVariants.item}
                  id="levelup-message"
                >
                  Доступны новые постройки
                </motion.p>
              </motion.div>

              <motion.p
                className="m-0 text-caption text-[var(--color-text-secondary)] mt-8"
                initial={{ opacity: 0 }}
                animate={prefersReducedMotion ? { opacity: 0.8 } : { opacity: [0.3, 0.8, 0.3] }}
                transition={
                  prefersReducedMotion
                    ? undefined
                    : {
                        duration: 1.5,
                        repeat: Infinity,
                      }
                }
              >
                Коснитесь для продолжения
              </motion.p>

              <motion.button
                ref={primaryActionRef}
                type="button"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-lime text-dark-bg font-semibold text-base shadow-lg focus-ring"
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                onClick={onDismiss}
                aria-label="Закрыть поздравительный экран и вернуться в игру"
              >
                Продолжить
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
