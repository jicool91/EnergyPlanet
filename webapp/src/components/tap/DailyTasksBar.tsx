import { memo } from 'react';

interface DailyTasksBarProps {
  nextBoostAvailabilityMs?: number;
  claimableAchievements: number;
  onViewBoosts: () => void;
  onViewAchievements: () => void;
  onViewLeaderboard: () => void;
  socialPlayerCount?: number;
  isSocialBlockLoading?: boolean;
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
}: DailyTasksBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <button
        type="button"
        className="flex items-center justify-between rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.75)] px-5 py-4 text-left transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
        onClick={onViewBoosts}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(74,222,128,0.18)] text-lg">
            ⚡
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              Бусты и события
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">
              Следующий через {formatDuration(nextBoostAvailabilityMs)}
            </span>
          </div>
        </div>
        <span className="rounded-full bg-[rgba(74,222,128,0.2)] px-3 py-1 text-xs font-semibold text-[var(--color-success)]">
          Открыть
        </span>
      </button>

      <div className="flex flex-col gap-3 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.75)] px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(250,210,88,0.18)] text-lg">
              🏆
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Достижения
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                Готово к выдаче: {claimableAchievements}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewAchievements}
            className="rounded-2xl border border-[rgba(255,255,255,0.12)] px-3 py-1 text-xs text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
          >
            Открыть
          </button>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
              Рейтинг друзей
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {isSocialBlockLoading ? 'Загрузка…' : `${socialPlayerCount} игроков`}
            </p>
          </div>
          <button
            type="button"
            onClick={onViewLeaderboard}
            className="rounded-2xl bg-[rgba(255,255,255,0.08)] px-3 py-1 text-xs text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
          >
            Смотреть
          </button>
        </div>
      </div>
    </div>
  );
});
