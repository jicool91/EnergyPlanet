/**
 * Tap particle effect component
 * Shows glow and ripple animations when planet is tapped
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TapParticlesProps {
  children: React.ReactNode;
  onTap: () => void;
  disabled?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/**
 * TapParticles: Shows glow + ripple effects on tap
 * - Glow: Expanding cyan aura from center
 * - Ripple: Multiple expanding circles from tap point
 */
export const TapParticles: React.FC<TapParticlesProps> = ({
  children,
  onTap,
  disabled = false,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isGlowing, setIsGlowing] = useState(false);

  const triggerRipple = (x: number, y: number) => {
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 800);
  };

  const triggerGlow = () => {
    setIsGlowing(true);
    setTimeout(() => setIsGlowing(false), 600);
  };

  const handleMouseTap = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    triggerRipple(x, y);
    triggerGlow();

    // Call parent tap handler
    onTap();
  };

  return (
    <div
      className="relative cursor-pointer select-none"
      onClick={handleMouseTap}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (disabled) {
            return;
          }

          const rect = event.currentTarget.getBoundingClientRect();
          const x = rect.width / 2;
          const y = rect.height / 2;

          triggerRipple(x, y);
          triggerGlow();
          onTap();
        }
      }}
    >
      {/* Glow effect backdrop */}
      {isGlowing && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none will-transform"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.2 }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            boxShadow: '0 0 40px rgba(0, 217, 255, 0.6)',
          }}
        />
      )}

      {/* Main content */}
      <div className="relative z-10">{children}</div>

      {/* Ripple particles */}
      {ripples.map(ripple => (
        <RippleParticle key={ripple.id} x={ripple.x} y={ripple.y} />
      ))}
    </div>
  );
};

/**
 * Individual ripple particle
 */
const RippleParticle: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  return (
    <motion.div
      className="absolute pointer-events-none border-2 border-cyan/60 rounded-full will-transform"
      initial={{
        left: x,
        top: y,
        width: 0,
        height: 0,
        opacity: 1,
      }}
      animate={{
        left: x - 40,
        top: y - 40,
        width: 80,
        height: 80,
        opacity: 0,
      }}
      transition={{
        duration: 0.8,
        ease: 'easeOut',
      }}
    />
  );
};
