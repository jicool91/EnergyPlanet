/**
 * Purchase Success Modal Component
 * Shows animated success feedback when player purchases/upgrades building
 */

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckmarkAnimation } from './animations/CheckmarkAnimation';
import { Confetti } from './animations/Confetti';
import { useSoundEffect } from '@/hooks/useSoundEffect';

interface PurchaseSuccessModalProps {
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
 *   itemName="Solar Panel"
 *   quantity={1}
 *   cost={5000}
 *   onDismiss={handleClose}
 * />
 */
export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({
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
    playSound('success');

    if (autoClose) {
      const timer = setTimeout(onDismiss, autoCloseDuration);
      return () => clearTimeout(timer);
    }
  }, [playSound, autoClose, autoCloseDuration, onDismiss]);

  return (
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
          className="bg-dark-secondary rounded-lg p-8 w-full max-w-[360px] shadow-[0_16px_40px_rgba(10,17,61,0.35)] border border-lime/40 text-center"
          initial={{ scale: 0.5, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 30, opacity: 0 }}
          transition={{
            type: 'spring',
            bounce: 0.6,
            duration: 0.5,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Checkmark */}
          <div className="mb-6">
            <CheckmarkAnimation size={80} color="#48ffad" duration={0.6} />
          </div>

          {/* Success Text */}
          <motion.h2
            className="m-0 mb-2 text-2xl font-bold text-lime"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            Успешно!
          </motion.h2>

          {/* Item Info */}
          <motion.div
            className="mb-6 text-white/75"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <p className="m-0 text-lg font-semibold text-white mb-1">{itemName}</p>
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
          <motion.button
            type="button"
            className="px-6 py-3 rounded-lg border-0 text-sm font-semibold cursor-pointer transition-all duration-120 bg-gradient-to-br from-lime/30 to-cyan/30 text-white hover:shadow-[0_8px_20px_rgba(72,255,173,0.3)] active:scale-95 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            onClick={onDismiss}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
          >
            Отлично!
          </motion.button>
        </motion.div>
      </motion.div>
    </>
  );
};
