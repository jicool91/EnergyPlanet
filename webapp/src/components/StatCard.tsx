import { memo } from 'react';
import type { ReactNode } from 'react';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  subLabel?: ReactNode;
  tone?: 'default' | 'positive' | 'warning';
  size?: 'compact' | 'standard' | 'hero';
  onClick?: () => void;
}

/**
 * Design System: Tone-based styling using standardized tokens
 * No hardcoded colors - all colors from tailwind.config.js
 */
const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  default:
    'bg-surface-glass-strong border border-border-cyan/60 text-text-primary shadow-elevation-2',
  positive:
    'bg-gradient-to-br from-feedback-success/25 to-layer-strong border border-feedback-success/70 text-feedback-success shadow-glow-lime',
  warning:
    'bg-gradient-to-br from-accent-gold/35 to-layer-overlay-strong border border-accent-gold/60 text-feedback-warning shadow-glow-gold',
};

function StatCardComponent({
  icon,
  label,
  value,
  subLabel,
  tone = 'default',
  size = 'standard',
  onClick,
}: StatCardProps) {
  const sizeStyles: Record<NonNullable<StatCardProps['size']>, string> = {
    compact: 'min-h-[120px] px-md py-sm-plus rounded-2xl gap-sm',
    standard: 'min-h-[156px] px-md py-md rounded-2xl gap-md',
    hero: 'min-h-[168px] px-lg py-lg rounded-3xl gap-md',
  };

  const typography: Record<NonNullable<StatCardProps['size']>, string> = {
    compact: 'text-title font-semibold',
    standard: 'stat-display font-bold',
    hero: 'text-heading font-bold',
  };

  const base = 'flex flex-col h-full transition-transform duration-150 ease-out min-w-0';
  const toneClass = toneStyles[tone];
  const sizeClass = sizeStyles[size];
  const labelTextClass =
    size === 'compact'
      ? 'text-caption font-medium leading-tight tracking-[0.04em] text-text-secondary'
      : 'text-label uppercase tracking-[0.16em] text-text-secondary';
  const labelRowGap = size === 'compact' ? 'gap-xs' : 'gap-sm';
  const iconClass =
    size === 'compact' ? 'text-title' : size === 'hero' ? 'text-heading' : 'text-heading';
  const valueClass = `${typography[size]} text-text-primary leading-tight`;

  const content = (
    <>
      {/* Label row: icon + text label */}
      <div className={`flex items-center ${labelRowGap}`}>
        <span className={iconClass} aria-hidden>
          {icon}
        </span>
        <span className={labelTextClass}>{label}</span>
      </div>

      {/* Value: large, bold, white */}
      <div className={valueClass}>{value}</div>

      {/* Optional subLabel: small, muted */}
      {subLabel && (
        <div className="flex flex-col gap-xs text-body-sm text-text-secondary">{subLabel}</div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${base} ${sizeClass} ${toneClass} text-left hover:-translate-y-0.5 focus-ring`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className={`${base} ${sizeClass} ${toneClass}`}>{content}</div>;
}

export const StatCard = memo(StatCardComponent);

StatCard.displayName = 'StatCard';
