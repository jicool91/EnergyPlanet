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
    'bg-[var(--color-surface-secondary)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)]',
  positive: 'bg-lime/10 border-[rgba(72,255,173,0.4)] text-[var(--color-success)]',
  warning: 'bg-orange/10 border-[rgba(255,201,87,0.4)] text-[var(--color-warning)]',
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
    'flex flex-col gap-sm rounded-md border px-md py-sm-plus transition-transform duration-150 ease-out min-w-0';
  const toneClass = toneStyles[tone];

  const content = (
    <>
      {/* Label row: icon + text label */}
      <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <span className="text-micro uppercase tracking-wide">{label}</span>
      </div>

      {/* Value: large, bold, white */}
      <div className="stat-display text-[var(--color-text-primary)]">{value}</div>

      {/* Optional subLabel: small, muted */}
      {subLabel && (
        <div className="text-caption text-[var(--color-text-secondary)]">{subLabel}</div>
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
