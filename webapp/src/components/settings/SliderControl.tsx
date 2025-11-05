import React from 'react';

interface SliderControlProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  disabled = false,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-medium text-token-secondary">{label}</label>}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 h-2 appearance-none rounded-full bg-surface-glass-strong focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 focus:ring-offset-surface-primary"
          style={{
            background: `linear-gradient(to right, var(--color-success) 0%, var(--color-success) ${percentage}%, color-mix(in srgb, var(--color-border-subtle) 40%, transparent) ${percentage}%, color-mix(in srgb, var(--color-border-subtle) 40%, transparent) 100%)`,
          }}
        />
        <span className="w-10 text-right text-sm font-semibold text-token-secondary">{value}%</span>
      </div>
    </div>
  );
};
