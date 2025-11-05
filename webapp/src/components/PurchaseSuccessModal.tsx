/**
 * Purchase Success Modal Component
 * Shows animated success feedback when player purchases/upgrades building
 */

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { CheckmarkAnimation } from './animations/CheckmarkAnimation';
import { Confetti } from './animations/Confetti';
import { useSoundEffect } from '@/hooks/useSoundEffect';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  itemName: string;
  quantity?: number;
  cost?: number;
  onDismiss: () => void;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

/**
 * PurchaseSuccessModal: Displays success feedback with animations
 *
 * Features:
 * - Bounce-in modal animation
 * - Animated checkmark (SVG stroke)
 * - Confetti particle effect
 * - Success sound effect
 * - Auto-close after delay
 *
 * Example:
 * <PurchaseSuccessModal
 *   isOpen={true}
 *   itemName="Solar Panel"
 *   quantity={1}
 *   cost={5000}
 *   onDismiss={handleClose}
 * />
 */
export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
  isOpen,
  itemName,
  quantity = 1,
  cost,
  onDismiss,
  autoClose = true,
  autoCloseDuration = 2000,
}) => {
  const playSound = useSoundEffect();

  // Play success sound and auto-close on mount
  useEffect(() => {
    if (isOpen) {
      playSound('success');

      if (autoClose) {
        const timer = setTimeout(onDismiss, autoCloseDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, playSound, autoClose, autoCloseDuration, onDismiss]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          <Confetti count={30} duration={2.5} />

          {/* Modal Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[999]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onDismiss}
          >
            {/* Modal Content with Spring Animation */}
            <motion.div
              className="w-full max-w-sm rounded-3xl border border-feedback-success/70 bg-gradient-to-br from-feedback-success/20 via-surface-glass-strong to-accent-magenta/25 p-8 text-center shadow-elevation-4 backdrop-blur-md"
              initial={{ scale: 0.5, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.5, y: 30, opacity: 0 }}
              transition={{
                type: 'spring',
                bounce: 0.6,
                duration: 0.5,
              }}
              onClick={e => e.stopPropagation()}
              role="status"
              aria-live="polite"
            >
              {/* Checkmark */}
              <div className="mb-6">
                <CheckmarkAnimation size={80} color="#00ff88" duration={0.6} />
              </div>

              {/* Success Text */}
              <motion.h2
                className="m-0 mb-2 flex items-center justify-center gap-2 text-heading font-bold text-feedback-success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <span role="img" aria-label="Success" className="text-2xl">
                  ✅
                </span>
                Успешно!
              </motion.h2>

              {/* Item Info */}
              <motion.div
                className="mb-6 text-body text-text-secondary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <p className="m-0 text-heading font-semibold text-token-primary mb-1">{itemName}</p>
                {quantity > 1 && (
                  <p className="m-0 text-sm">
                    Количество: <span className="text-cyan font-semibold">×{quantity}</span>
                  </p>
                )}
                {cost !== undefined && (
                  <p className="m-0 text-sm">
                    Стоимость:{' '}
                    <span className="text-gold font-semibold">{cost.toLocaleString()} E</span>
                  </p>
                )}
              </motion.div>

              {/* Close Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <Button
                  variant="success"
                  size="md"
                  fullWidth
                  onClick={onDismiss}
                  className="shadow-glow"
                >
                  Отлично!
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
