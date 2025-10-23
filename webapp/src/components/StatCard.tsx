import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  subLabel?: ReactNode;
  tone?: 'default' | 'positive' | 'warning';
  onClick?: () => void;
}

const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-dark-secondary/70 border-white/10 text-white/80',
  positive: 'bg-lime/10 border-lime/30 text-[#b5ffd8]',
  warning: 'bg-orange/10 border-orange/30 text-[#ffd798]',
};

export function StatCard({
  icon,
  label,
  value,
  subLabel,
  tone = 'default',
  onClick,
}: StatCardProps) {
  const base =
    'flex flex-col gap-1.5 rounded-2xl border px-4 py-3 transition-transform duration-150 ease-out';
  const toneClass = toneStyles[tone];
  const content = (
    <>
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-lg" aria-hidden>
          {icon}
        </span>
        <span className="uppercase tracking-[0.6px] text-xs">{label}</span>
      </div>
      <div className="text-xl font-semibold text-white">{value}</div>
      {subLabel && <div className="text-xs text-white/60">{subLabel}</div>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${base} ${toneClass} text-left focus:outline-none hover:-translate-y-0.5`}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return <div className={`${base} ${toneClass}`}>{content}</div>;
}
