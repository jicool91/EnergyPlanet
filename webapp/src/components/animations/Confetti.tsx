/**
 * Confetti Animation Component
 * Displays falling confetti particles on success events
 * Adapts particle count based on device capabilities
 */

import React, { useMemo, useEffect, useState } from 'react';
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

/**
 * Confetti: Generates falling confetti particles
 * Each particle has random position, rotation, size, and color
 * Adapts particle count based on device capabilities
 */
export const Confetti: React.FC<ConfettiProps> = ({ count = 30, duration = 2.5 }) => {
  const capabilities = useDeviceCapabilities();
  const [isReady, setIsReady] = useState(false);

  // Use adaptive particle count based on device capabilities
  const adaptiveCount = Math.min(count, capabilities.maxParticles);

  // Lazy initialize particles only when component mounts
  useEffect(() => {
    setIsReady(true);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    if (!isReady) return [];

    const result: Particle[] = [];

    for (let i = 0; i < adaptiveCount; i++) {
      result.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 0.2,
        duration: duration + Math.random() * 0.5,
        rotation: Math.random() * 720,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    return result;
  }, [adaptiveCount, duration, isReady]);

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
