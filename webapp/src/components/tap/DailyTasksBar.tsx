import { memo } from 'react';
import clsx from 'clsx';

interface DailyTasksBarProps {
  nextBoostAvailabilityMs?: number;
  claimableAchievements: number;
  onViewBoosts: () => void;
  onViewAchievements: () => void;
  onViewLeaderboard: () => void;
  socialPlayerCount?: number;
  isSocialBlockLoading?: boolean;
  paletteVariant?: string;
}

function formatDuration(ms?: number): string {
  if (ms === undefined) {
    return '—';
  }
  if (ms <= 0) {
    return 'готов';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds} сек`;
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} мин`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} ч`;
}

export const DailyTasksBar = memo(function DailyTasksBar({
  nextBoostAvailabilityMs,
  claimableAchievements,
  onViewBoosts,
  onViewAchievements,
  onViewLeaderboard,
  socialPlayerCount = 0,
  isSocialBlockLoading = false,
  paletteVariant = 'classic',
}: DailyTasksBarProps) {
  const isDualAccent = paletteVariant === 'dual-accent';

  const boostCardClass = clsx(
    'flex items-center justify-between rounded-3xl px-5 py-4 text-left transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    isDualAccent
      ? 'border border-state-card-highlight-border bg-gradient-soft hover:-translate-y-0.5 focus-visible:ring-state-card-highlight-border focus-visible:ring-offset-surface-primary shadow-state-card-highlight'
      : 'border border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.75)] hover:-translate-y-0.5 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]'
  );

  const boostBadgeClass = clsx(
    'flex h-10 w-10 items-center justify-center rounded-2xl text-lg',
    isDualAccent ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-[rgba(74,222,128,0.18)]'
  );

  const openBadgeClass = clsx(
    'rounded-full px-3 py-1 text-xs font-semibold',
    isDualAccent
      ? 'bg-accent-magenta/25 text-accent-magenta'
      : 'bg-[rgba(74,222,128,0.2)] text-[var(--color-success)]'
  );

  const achievementsCardClass = clsx(
    'flex flex-col gap-3 rounded-3xl px-5 py-4',
    isDualAccent
      ? 'border border-state-card-highlight-border bg-gradient-soft shadow-state-card-highlight'
      : 'border border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.75)]'
  );

  const achievementsIconClass = clsx(
    'flex h-10 w-10 items-center justify-center rounded-2xl text-lg',
    isDualAccent ? 'bg-accent-magenta/25 text-accent-magenta' : 'bg-[rgba(250,210,88,0.18)]'
  );

  const secondaryButtonClass = clsx(
    'rounded-2xl px-3 py-1 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    isDualAccent
      ? 'border border-state-card-highlight-border text-text-primary hover:bg-layer-soft focus-visible:ring-state-card-highlight-border focus-visible:ring-offset-surface-primary'
      : 'border border-[rgba(255,255,255,0.12)] text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.06)] focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]'
  );

  const leaderboardCardClass = clsx(
    'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
    isDualAccent
      ? 'border-state-card-highlight-border/60 bg-layer-soft text-text-secondary'
      : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]'
  );

  const leaderboardButtonClass = clsx(
    'rounded-2xl px-3 py-1 text-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    isDualAccent
      ? 'bg-gradient-soft text-text-primary hover:brightness-110 focus-visible:ring-state-card-highlight-border focus-visible:ring-offset-surface-primary'
      : 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-primary)] hover:bg-[rgba(255,255,255,0.12)] focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-[var(--color-bg-primary)]'
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <button type="button" className={boostCardClass} onClick={onViewBoosts}>
        <div className="flex items-center gap-3">
          <span className={boostBadgeClass}>⚡</span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Бусты и события
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Следующий через {formatDuration(nextBoostAvailabilityMs)}
            </span>
          </div>
        </div>
        <span className={openBadgeClass}>Открыть</span>
      </button>

      <div className={achievementsCardClass}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={achievementsIconClass}>🏆</span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Достижения
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                Готово к выдаче: {claimableAchievements}
              </span>
            </div>
          </div>
          <button type="button" onClick={onViewAchievements} className={secondaryButtonClass}>
            Открыть
          </button>
        </div>
        <div className={leaderboardCardClass}>
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              Рейтинг друзей
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isSocialBlockLoading ? 'Загрузка…' : `${socialPlayerCount} игроков`}
            </p>
          </div>
          <button type="button" onClick={onViewLeaderboard} className={leaderboardButtonClass}>
            Смотреть
          </button>
        </div>
      </div>
    </div>
  );
});
