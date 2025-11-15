import { memo } from 'react';
import { Button, Surface, Text } from '@/components';
import { Skeleton } from '@/components/ui/Skeleton';

interface FriendsListProps {
  totalInvites: number;
  dailyInvitesUsed: number;
  dailyInvitesLimit: number;
  referredByName?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onInvite: () => void;
  onViewLeaderboard: () => void;
  onRetry: () => void;
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
  onRetry,
}: FriendsListProps) {
  if (error) {
    return (
      <Surface
        tone="secondary"
        border="strong"
        elevation="soft"
        padding="lg"
        rounded="3xl"
        className="flex flex-col gap-3 border-feedback-error/50 bg-feedback-error/15 text-text-primary"
      >
        <Text variant="body" weight="semibold">
          Не удалось загрузить рефералов.
        </Text>
        <Text variant="bodySm" tone="secondary">
          {error}
        </Text>
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Повторить загрузку
        </Button>
      </Surface>
    );
  }

  if (isLoading) {
    return (
      <Surface
        tone="secondary"
        border="subtle"
        elevation="soft"
        padding="lg"
        rounded="3xl"
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
      </Surface>
    );
  }

  const invitesExhausted =
    dailyInvitesLimit > 0 &&
    dailyInvitesUsed >= dailyInvitesLimit &&
    Number.isFinite(dailyInvitesLimit);

  return (
    <Surface
      tone="secondary"
      border="subtle"
      elevation="soft"
      padding="lg"
      rounded="3xl"
      className="flex flex-col gap-4"
    >
      <header className="flex items-center justify-between gap-4">
        <div>
          <Text variant="label" tone="secondary" transform="uppercase">
            Реферальная программа
          </Text>
          <Text variant="title" weight="semibold">
            Приглашено друзей: {totalInvites}
          </Text>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button size="sm" onClick={onInvite} disabled={invitesExhausted}>
            {invitesExhausted ? 'Лимит исчерпан' : 'Пригласить друга'}
          </Button>
          {invitesExhausted ? (
            <Text variant="caption" tone="warning">
              Лимит приглашений на сегодня исчерпан
            </Text>
          ) : null}
        </div>
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
          className="rounded-2xl border border-border-layer bg-layer-soft px-4 py-3 text-left text-body text-text-primary transition-colors duration-150 hover:bg-layer-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
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
    </Surface>
  );
});
