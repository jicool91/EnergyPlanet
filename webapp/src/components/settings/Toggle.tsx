import React from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '../../hooks/useHaptic';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, disabled = false }) => {
  const { light } = useHaptic();

  const handleChange = (newState: boolean) => {
    if (!disabled) {
      light();
      onChange(newState);
    }
  };

  return (
    <motion.button
      onClick={() => handleChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        enabled ? 'bg-lime-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        layout
        className="h-5 w-5 rounded-full bg-white shadow-md"
        animate={{
          x: enabled ? 22 : 2,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};
