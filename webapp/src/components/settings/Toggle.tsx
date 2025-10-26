import React from 'react';
import { motion } from 'framer-motion';
import { useHaptic } from '../../hooks/useHaptic';

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  enabled,
  onChange,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
}) => {
  const { light, isSupported } = useHaptic();

  const handleChange = (newState: boolean) => {
    if (!disabled) {
      if (isSupported) {
        light();
      }
      onChange(newState);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleChange(!enabled);
    }
  };

  const toggleClasses = [
    'relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus-ring',
    enabled ? 'bg-lime-500' : 'bg-gray-600',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg',
  ].join(' ');

  return (
    <motion.button
      type="button"
      onClick={() => handleChange(!enabled)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role="switch"
      aria-checked={enabled}
      aria-disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={toggleClasses}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      <motion.div
        layout
        className="h-5 w-5 rounded-full bg-white shadow-md"
        aria-hidden="true"
        animate={{
          x: enabled ? 22 : 2,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
};
