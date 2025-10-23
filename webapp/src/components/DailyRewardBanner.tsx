/**
 * Daily Reward Banner Component
 * FOMO element showing daily login reward
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DailyRewardBannerProps {
  onClaim?: () => void;
}

export const DailyRewardBanner: React.FC<DailyRewardBannerProps> = ({ onClaim }) => {
  const [timeLeft, setTimeLeft] = useState('23:59:59');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg bg-gradient-to-r from-gold/40 to-orange/40 border border-gold/60 p-4 shadow-lg"
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-gold/20 to-transparent opacity-50"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-bounce">🎁</span>
          <div>
            <p className="m-0 text-sm font-bold text-gold">Ежедневное вознаграждение</p>
            <p className="m-0 text-xs text-gold/80">Приходит через {timeLeft}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClaim}
          className="flex-shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-gold to-orange hover:from-gold/90 hover:to-orange/90 text-dark-bg font-bold text-sm transition-all duration-200 shadow-md"
          type="button"
        >
          Получить
        </motion.button>
      </div>
    </motion.div>
  );
};
