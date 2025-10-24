import type { ReactNode } from 'react';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  subLabel?: ReactNode;
  tone?: 'default' | 'positive' | 'warning';
  onClick?: () => void;
}

/**
 * Design System: Tone-based styling using standardized tokens
 * No hardcoded colors - all colors from tailwind.config.js
 */
const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-dark-secondary/70 border-white/10 text-white/80',
  positive: 'bg-lime/10 border-lime/30 text-lime',
  warning: 'bg-orange/10 border-orange/30 text-orange',
};

export function StatCard({
  icon,
  label,
  value,
  subLabel,
  tone = 'default',
  onClick,
}: StatCardProps) {
  // Base: flex + gap + rounded + border + padding + transition
  const base =
    'flex flex-col gap-2 rounded-md border px-4 py-3 transition-transform duration-150 ease-out min-w-0';
  const toneClass = toneStyles[tone];

  const content = (
    <>
      {/* Label row: icon + text label */}
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <span className="text-micro uppercase tracking-wide">{label}</span>
      </div>

      {/* Value: large, bold, white */}
      <div className="stat-display text-white">{value}</div>

      {/* Optional subLabel: small, muted */}
      {subLabel && <div className="text-caption text-white/60">{subLabel}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${base} ${toneClass} text-left hover:-translate-y-0.5 focus-ring`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className={`${base} ${toneClass}`}>{content}</div>;
}
