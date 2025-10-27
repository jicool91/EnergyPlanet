/**
 * Confetti Animation Component
 * Displays falling confetti particles on success events
 * Adapts particle count based on device capabilities
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';

interface ConfettiProps {
  count?: number;
  duration?: number;
}

interface Particle {
  id: number;
  left: string;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  color: string;
}

const colors = ['#00d9ff', '#48ffad', '#ffd700', '#ff8d4d'];

const createPseudoRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Confetti: Generates falling confetti particles
 * Each particle has random position, rotation, size, and color
 * Adapts particle count based on device capabilities
 */
export const Confetti: React.FC<ConfettiProps> = ({ count = 30, duration = 2.5 }) => {
  const capabilities = useDeviceCapabilities();

  // Use adaptive particle count based on device capabilities
  const adaptiveCount = Math.min(count, capabilities.maxParticles);

  const particles = useMemo<Particle[]>(() => {
    if (adaptiveCount <= 0) {
      return [];
    }

    const seed = adaptiveCount * 1000 + Math.round(duration * 100);
    const random = createPseudoRandom(seed);

    return Array.from({ length: adaptiveCount }, (_, index) => {
      const left = `${random() * 100}%`;
      const delay = random() * 0.2;
      const particleDuration = duration + random() * 0.5;
      const rotation = random() * 720;
      const size = 4 + random() * 8;
      const color = colors[Math.floor(random() * colors.length)];

      return {
        id: index,
        left,
        delay,
        duration: particleDuration,
        rotation,
        size,
        color,
      } satisfies Particle;
    });
  }, [adaptiveCount, duration]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full will-transform"
          style={{
            left: particle.left,
            top: 0,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          initial={{
            y: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            y: window.innerHeight + 50,
            opacity: 0,
            rotate: particle.rotation,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
};
