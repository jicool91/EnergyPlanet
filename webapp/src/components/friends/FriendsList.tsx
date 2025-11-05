import { memo } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

interface FriendsListProps {
  totalInvites: number;
  dailyInvitesUsed: number;
  dailyInvitesLimit: number;
  referredByName?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onInvite: () => void;
  onViewLeaderboard: () => void;
}

export const FriendsList = memo(function FriendsList({
  totalInvites,
  dailyInvitesUsed,
  dailyInvitesLimit,
  referredByName,
  isLoading = false,
  error,
  onInvite,
  onViewLeaderboard,
}: FriendsListProps) {
  if (error) {
    return (
      <Card className="flex flex-col gap-3 border-state-danger-border bg-[var(--state-danger-surface)] text-[var(--color-text-primary)]">
        <p className="m-0 text-sm font-semibold">Не удалось загрузить рефералов.</p>
        <span className="text-xs text-[var(--color-text-secondary)]">{error}</span>
        <Button size="sm" variant="secondary" onClick={onInvite}>
          Попробовать ещё раз
        </Button>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card
        className="flex flex-col gap-3 animate-pulse"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-4 w-1/3 rounded bg-layer-overlay-ghost-soft" />
        <div className="flex gap-3">
          <div className="h-16 flex-1 rounded bg-layer-overlay-ghost-soft" />
          <div className="h-16 flex-1 rounded bg-layer-overlay-ghost-soft" />
        </div>
        <div className="h-10 w-32 rounded-full bg-layer-overlay-ghost-soft" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Реферальная программа
          </p>
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">
            Приглашено друзей: {totalInvites}
          </p>
        </div>
        <Button size="sm" onClick={onInvite}>
          Пригласить друга
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border-layer bg-layer-soft px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Сегодня: {dailyInvitesUsed}/{dailyInvitesLimit || '∞'}
        </div>
        <button
          type="button"
          onClick={onViewLeaderboard}
          className="rounded-2xl border border-border-layer bg-layer-soft px-4 py-3 text-left text-sm text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-layer-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
        >
          Посмотреть друзей в рейтинге
        </button>
      </div>

      {referredByName && (
        <div className="rounded-2xl border border-state-card-highlight-border bg-[var(--surface-dual-highlight-soft)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
          Вас пригласил <strong>{referredByName}</strong> — спасибо за поддержку!
        </div>
      )}
    </Card>
  );
});
