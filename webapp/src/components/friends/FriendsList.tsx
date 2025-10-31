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
      <Card className="flex flex-col gap-3 border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.1)] text-[var(--color-text-primary)]">
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
      <Card className="flex flex-col gap-3 animate-pulse border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.72)]">
        <div className="h-4 w-1/3 rounded bg-[rgba(255,255,255,0.08)]" />
        <div className="flex gap-3">
          <div className="h-16 flex-1 rounded bg-[rgba(255,255,255,0.08)]" />
          <div className="h-16 flex-1 rounded bg-[rgba(255,255,255,0.08)]" />
        </div>
        <div className="h-10 w-32 rounded-full bg-[rgba(255,255,255,0.08)]" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.72)]">
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
        <div className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          Сегодня: {dailyInvitesUsed}/{dailyInvitesLimit || '∞'}
        </div>
        <button
          type="button"
          onClick={onViewLeaderboard}
          className="rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-left text-sm text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-text-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]"
        >
          Посмотреть друзей в рейтинге
        </button>
      </div>

      {referredByName && (
        <div className="rounded-2xl border border-[rgba(120,63,255,0.4)] bg-[rgba(120,63,255,0.14)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
          Вас пригласил <strong>{referredByName}</strong> — спасибо за поддержку!
        </div>
      )}
    </Card>
  );
});
