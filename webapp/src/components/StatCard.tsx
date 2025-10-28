import { memo } from 'react';
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
  default:
    'bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] shadow-elevation-1',
  positive:
    'bg-[rgba(0,255,136,0.18)] border border-[rgba(0,255,136,0.5)] text-[var(--color-success)] shadow-glow-lime',
  warning:
    'bg-[rgba(255,141,77,0.18)] border border-[rgba(255,141,77,0.5)] text-[var(--color-warning)] shadow-glow-gold',
};

function StatCardComponent({
  icon,
  label,
  value,
  subLabel,
  tone = 'default',
  onClick,
}: StatCardProps) {
  // Base: flex + gap + rounded + border + padding + transition
  const base =
    'flex flex-col gap-sm rounded-xl px-md py-md transition-transform duration-150 ease-out min-w-0 min-h-[116px]';
  const toneClass = toneStyles[tone];

  const content = (
    <>
      {/* Label row: icon + text label */}
      <div className="flex items-center gap-sm text-[var(--color-text-secondary)]">
        <span className="text-title" aria-hidden>
          {icon}
        </span>
        <span className="text-label uppercase text-[var(--color-text-secondary)]">{label}</span>
      </div>

      {/* Value: large, bold, white */}
      <div className="stat-display text-[var(--color-text-primary)] font-bold">{value}</div>

      {/* Optional subLabel: small, muted */}
      {subLabel && (
        <div className="text-body-sm text-[var(--color-text-secondary)]">{subLabel}</div>
      )}
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

export const StatCard = memo(StatCardComponent);

StatCard.displayName = 'StatCard';
