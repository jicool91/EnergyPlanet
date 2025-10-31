import { memo } from 'react';
import { Card } from '@/components/Card';

export interface AirdropEvent {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  status: 'upcoming' | 'active' | 'finished';
  reward?: string;
}

interface AirdropTimelineProps {
  events: AirdropEvent[];
}

function formatDate(date: string): string {
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) {
    return date;
  }
  return dt.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
  });
}

export const AirdropTimeline = memo(function AirdropTimeline({ events }: AirdropTimelineProps) {
  if (!events.length) {
    return (
      <Card className="flex flex-col gap-3 border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.72)]">
        <h3 className="m-0 text-heading font-semibold text-[var(--color-text-primary)]">
          Пока событий нет
        </h3>
        <p className="m-0 text-sm text-[var(--color-text-secondary)]">
          Следите за Telegram-каналом — мы скоро объявим новые сезоны и награды.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map(event => {
        const isActive = event.status === 'active';
        const isUpcoming = event.status === 'upcoming';
        const badgeText = isActive ? 'Активно' : isUpcoming ? 'Скоро' : 'Завершено';
        const badgeColor = isActive
          ? 'bg-[rgba(74,222,128,0.16)] text-[var(--color-success)]'
          : isUpcoming
            ? 'bg-[rgba(243,186,47,0.18)] text-[var(--color-accent-gold)]'
            : 'bg-[rgba(255,255,255,0.08)] text-[var(--color-text-secondary)]';

        return (
          <Card
            key={event.id}
            className="flex flex-col gap-3 border-[rgba(255,255,255,0.08)] bg-[rgba(36,38,45,0.72)]"
          >
            <header className="flex items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-title font-semibold text-[var(--color-text-primary)]">
                  {event.title}
                </h3>
                <p className="m-0 text-xs text-[var(--color-text-secondary)]">
                  {formatDate(event.startsAt)}
                  {event.endsAt ? ` — ${formatDate(event.endsAt)}` : ''}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeColor}`}>
                {badgeText}
              </span>
            </header>
            <p className="m-0 text-sm text-[var(--color-text-secondary)]">{event.description}</p>
            {event.reward ? (
              <div className="rounded-2xl border border-[rgba(243,186,47,0.35)] bg-[rgba(243,186,47,0.12)] px-4 py-2 text-xs text-[var(--color-accent-gold)]">
                Награда: {event.reward}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
});
