import { memo, useMemo } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import type {
  ReferralRevenueOverview,
  ReferralRevenueEvent,
  ReferralRevenueFriend,
} from '@/services/referrals';
import { formatNumberWithSpaces } from '@/utils/number';

interface ReferralRevenueCardProps {
  overview: ReferralRevenueOverview | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const formatStars = (value: number) => formatNumberWithSpaces(value);

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Неизвестно';
  }
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDisplayName = (friend: ReferralRevenueFriend['referred']) =>
  friend.username ?? friend.firstName ?? 'Неизвестно';

const getEventTitle = (event: ReferralRevenueEvent) => {
  const name = event.referred.username ?? event.referred.firstName ?? 'Друг';
  return `${name}: +${formatStars(event.shareAmount)}★`;
};

const getEventSubtitle = (event: ReferralRevenueEvent) => {
  const amount = formatStars(event.purchaseAmount);
  return `Покупка ${event.purchaseType} · ${amount}★ · ${formatDateTime(event.grantedAt)}`;
};

const Placeholder = () => (
  <Card className="flex flex-col gap-4 border-[rgba(255,255,255,0.08)] bg-[rgba(30,34,46,0.72)] animate-pulse">
    <div className="h-5 w-1/3 rounded bg-[rgba(255,255,255,0.08)]" />
    <div className="grid gap-3 md:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
        <div className="h-4 w-2/3 rounded bg-[rgba(255,255,255,0.08)]" />
        <div className="h-6 w-1/3 rounded bg-[rgba(255,255,255,0.12)]" />
      </div>
      <div className="flex flex-col gap-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-4">
        <div className="h-4 w-1/2 rounded bg-[rgba(255,255,255,0.08)]" />
        <div className="h-16 rounded bg-[rgba(255,255,255,0.08)]" />
      </div>
    </div>
  </Card>
);

export const ReferralRevenueCard = memo(function ReferralRevenueCard({
  overview,
  isLoading,
  error,
  onRetry,
}: ReferralRevenueCardProps) {
  const topFriends = useMemo(() => {
    if (!overview) {
      return [];
    }
    return overview.friends.slice(0, 4);
  }, [overview]);

  const recentEvents = useMemo(() => overview?.recent.slice(0, 5) ?? [], [overview]);

  if (isLoading && !overview) {
    return <Placeholder />;
  }

  if (error && !overview) {
    return (
      <Card className="flex flex-col gap-3 border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.12)] text-[var(--color-text-primary)]">
        <div className="text-sm font-semibold">Не удалось загрузить реферальный доход</div>
        <div className="text-xs text-[var(--color-text-secondary)]">{error}</div>
        <Button size="sm" onClick={onRetry} variant="secondary">
          Попробовать ещё раз
        </Button>
      </Card>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <Card className="flex flex-col gap-4 border-[rgba(176,88,255,0.45)] bg-[rgba(46,26,84,0.68)]">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
            Реферальный доход
          </p>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            +{formatStars(overview.totals.allTime)}★ за всё время
          </h2>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-secondary)]">
          <div className="rounded-xl border border-[rgba(255,255,255,0.14)] px-3 py-2">
            Сегодня:{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">
              +{formatStars(overview.totals.today)}★
            </span>
          </div>
          <div className="rounded-xl border border-[rgba(255,255,255,0.14)] px-3 py-2">
            За месяц:{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">
              +{formatStars(overview.totals.month)}★
            </span>
          </div>
          {overview.revenueShare && (
            <div className="rounded-xl border border-[rgba(255,255,255,0.14)] px-3 py-2">
              Ставка: {(overview.revenueShare.percentage * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Вклад друзей</h3>
            <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              Обновлено {formatDateTime(overview.updatedAt)}
            </span>
          </div>
          {topFriends.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              Как только ваши приглашённые совершат покупки, сюда попадут их результаты.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topFriends.map((friend, index) => (
                <li
                  key={friend.referred.userId || friend.referred.username || `friend-${index}`}
                  className="flex items-center justify-between rounded-xl bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {getDisplayName(friend.referred)}
                    </span>
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      Последняя покупка:{' '}
                      {friend.lastPurchaseAt ? formatDateTime(friend.lastPurchaseAt) : '—'}
                    </span>
                  </div>
                  <div className="text-right text-sm font-semibold text-[var(--color-text-primary)]">
                    +{formatStars(friend.totalShare)}★
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[rgba(17,20,32,0.62)] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Последние транзакции
            </h3>
            {isLoading && (
              <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
                Обновление…
              </span>
            )}
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              История покупок появится после первой оплаты ваших друзей.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentEvents.map(event => (
                <li
                  key={event.id}
                  className="flex flex-col gap-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2"
                >
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {getEventTitle(event)}
                  </span>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {getEventSubtitle(event)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {error && (
        <div className="rounded-xl border border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
          {error}
        </div>
      )}

      <footer className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
        <span>
          Данные обновляются автоматически; при необходимости воспользуйтесь кнопкой обновления.
        </span>
        <Button size="sm" variant="ghost" onClick={onRetry}>
          Обновить
        </Button>
      </footer>
    </Card>
  );
});
