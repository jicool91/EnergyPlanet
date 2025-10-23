/**
 * Tap Section Component
 * Centered big tap button with glow effect
 *
 * Features:
 * - Large interactive tap button
 * - Glow animation effect
 * - Responsive scaling (mobile-first)
 * - Hover and tap animations
 *
 * Usage:
 * ```tsx
 * <TapSection onTap={handleTap} />
 * ```
 */

import { motion } from 'framer-motion';

interface TapSectionProps {
  onTap: () => void;
}

export function TapSection({ onTap }: TapSectionProps) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center p-4 w-full">
      <motion.button
        onClick={onTap}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-cyan via-lime to-gold text-black font-bold text-4xl md:text-5xl shadow-2xl border-2 border-cyan/50 hover:border-cyan transition-all duration-300 active:scale-95"
        aria-label="Tap to generate energy"
        type="button"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan to-lime opacity-20 blur-xl -z-10"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />

        {/* Tap indicator */}
        🌍
      </motion.button>
    </div>
  );
}
