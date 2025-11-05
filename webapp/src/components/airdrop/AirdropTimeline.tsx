import { memo } from 'react';
import { Card } from '@/components/Card';
import { Text } from '@/components/ui/Text';

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
      <Card className="flex flex-col gap-3 border-border-layer bg-layer-overlay-strong">
        <h3 className="m-0 text-heading font-semibold text-text-primary">Пока событий нет</h3>
        <Text as="p" variant="body" tone="secondary" className="m-0">
          Следите за Telegram-каналом — мы скоро объявим новые сезоны и награды.
        </Text>
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
          ? 'bg-feedback-success/20 text-feedback-success'
          : isUpcoming
            ? 'bg-accent-gold/25 text-accent-gold'
            : 'bg-layer-overlay-ghost text-text-secondary';

        return (
          <Card
            key={event.id}
            className="flex flex-col gap-3 border-border-layer bg-layer-overlay-strong"
          >
            <header className="flex items-center justify-between gap-3">
              <div>
                <h3 className="m-0 text-title font-semibold text-text-primary">{event.title}</h3>
                <Text as="p" variant="caption" tone="secondary" className="m-0">
                  {formatDate(event.startsAt)}
                  {event.endsAt ? ` — ${formatDate(event.endsAt)}` : ''}
                </Text>
              </div>
              <Text
                as="span"
                variant="caption"
                weight="semibold"
                className={`rounded-full px-3 py-1 ${badgeColor}`}
              >
                {badgeText}
              </Text>
            </header>
            <Text as="p" variant="body" tone="secondary" className="m-0">
              {event.description}
            </Text>
            {event.reward ? (
              <Text
                as="div"
                variant="caption"
                tone="accent"
                className="rounded-2xl border border-accent-gold/60 bg-accent-gold/20 px-4 py-2"
              >
                Награда: {event.reward}
              </Text>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
});
