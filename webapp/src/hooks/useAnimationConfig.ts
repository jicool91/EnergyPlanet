/**
 * Animation configuration and utility hook for Framer Motion
 * Provides pre-configured animation variants and common patterns
 */

/**
 * Hook to get animation configs and presets
 * Useful for memoizing and customizing animations
 */
export const useAnimationConfig = () => {
  return {
    // Tap effect
    tapScale: {
      whileTap: { scale: 0.95 },
    },
    // Hover effect
    hoverScale: {
      whileHover: { scale: 1.02 },
    },
    // Button tap and hover
    buttonInteraction: {
      whileTap: { scale: 0.95 },
      whileHover: { scale: 1.05 },
    },
  };
};

// Common animation presets for reference
export const animationPresets = {
  tap: { whileTap: { scale: 0.95 } },
  hover: { whileHover: { scale: 1.02 } },
  tapAndHover: {
    whileTap: { scale: 0.95 },
    whileHover: { scale: 1.05 },
  },
};
