import { memo } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Text } from '@/components/ui/Text';
import { Skeleton } from '@/components/skeletons/Skeleton';

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
      <Card className="flex flex-col gap-3 border-state-danger-border bg-state-danger-surface text-text-primary">
        <Text as="p" variant="body" weight="semibold" className="m-0">
          Не удалось загрузить рефералов.
        </Text>
        <Text as="span" variant="bodySm" tone="secondary">
          {error}
        </Text>
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
        <Skeleton variant="text" className="w-1/3" />
        <div className="flex gap-3">
          <Skeleton className="h-16 flex-1" />
          <Skeleton className="h-16 flex-1" />
        </div>
        <Skeleton className="h-10 w-32 rounded-full" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <Text variant="label" tone="secondary" transform="uppercase">
            Реферальная программа
          </Text>
          <Text as="p" variant="title" weight="semibold" className="m-0">
            Приглашено друзей: {totalInvites}
          </Text>
        </div>
        <Button size="sm" onClick={onInvite}>
          Пригласить друга
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Text
          as="div"
          variant="body"
          tone="secondary"
          className="rounded-2xl border border-border-layer bg-layer-soft px-4 py-3"
        >
          Сегодня: {dailyInvitesUsed}/{dailyInvitesLimit || '∞'}
        </Text>
        <button
          type="button"
          onClick={onViewLeaderboard}
          className="rounded-2xl border border-border-layer bg-layer-soft px-4 py-3 text-left text-sm text-text-primary transition-colors duration-150 hover:bg-layer-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
        >
          <Text as="span" variant="body" tone="primary">
            Посмотреть друзей в рейтинге
          </Text>
        </button>
      </div>

      {referredByName && (
        <Text
          as="div"
          variant="body"
          tone="primary"
          className="rounded-2xl border border-state-card-highlight-border bg-surface-dual-soft px-4 py-3"
        >
          Вас пригласил <strong>{referredByName}</strong> — спасибо за поддержку!
        </Text>
      )}
    </Card>
  );
});
