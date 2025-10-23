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
      {label && <label className="text-sm font-medium text-white/80">{label}</label>}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 h-2 rounded-lg bg-gray-700 appearance-none cursor-pointer accent-lime-500"
          style={{
            background: `linear-gradient(to right, #48ffad 0%, #48ffad ${percentage}%, #4b5563 ${percentage}%, #4b5563 100%)`,
          }}
        />
        <span className="w-10 text-right text-sm font-semibold text-white/70">{value}%</span>
      </div>
    </div>
  );
};
