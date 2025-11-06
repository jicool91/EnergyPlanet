import { useMemo } from 'react';
import clsx from 'clsx';
import { Panel } from '@/components/Panel';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/Badge';

type EventStatus = 'upcoming' | 'live' | 'finished';
type EventKind = 'tournament' | 'quest' | 'raid' | 'season';
type ScheduleLocale = 'ru' | 'en';

export interface EventScheduleEntry {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  kind: EventKind;
  rewardSummary: string;
  highlight?: boolean;
}

export interface EventScheduleProps {
  events: EventScheduleEntry[];
  locale?: ScheduleLocale;
  timezone?: string;
  onSelectEvent?: (id: string) => void;
}

const KIND_LABEL: Record<ScheduleLocale, Record<EventKind, string>> = {
  ru: {
    tournament: 'Турнир',
    quest: 'Квест',
    raid: 'Рейд',
    season: 'Сезон',
  },
  en: {
    tournament: 'Tournament',
    quest: 'Quest',
    raid: 'Raid',
    season: 'Season',
  },
};

const STATUS_LABEL: Record<ScheduleLocale, Record<EventStatus, string>> = {
  ru: {
    upcoming: 'Скоро',
    live: 'Идёт',
    finished: 'Завершено',
  },
  en: {
    upcoming: 'Upcoming',
    live: 'Live now',
    finished: 'Finished',
  },
};

function resolveLocale(locale?: ScheduleLocale): ScheduleLocale {
  return locale === 'en' ? 'en' : 'ru';
}

function toDate(value: string): Date {
  return new Date(value);
}

function resolveStatus(now: Date, start: Date, end: Date): EventStatus {
  if (now >= start && now <= end) {
    return 'live';
  }
  if (now < start) {
    return 'upcoming';
  }
  return 'finished';
}

function formatRange(
  start: Date,
  end: Date,
  formatter: Intl.DateTimeFormat,
  timeFormatter: Intl.DateTimeFormat
): string {
  if ('formatRange' in formatter && typeof formatter.formatRange === 'function') {
    try {
      return formatter.formatRange(start, end);
    } catch {
      // fall back below
    }
  }

  return `${formatter.format(start)} · ${timeFormatter.format(start)} — ${timeFormatter.format(end)}`;
}

function formatRelativeLabel(now: Date, target: Date, locale: ScheduleLocale): string {
  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  const pluralize = (value: number, forms: [string, string, string]) => {
    if (value % 10 === 1 && value % 100 !== 11) {
      return forms[0];
    }
    if ([2, 3, 4].includes(value % 10) && ![12, 13, 14].includes(value % 100)) {
      return forms[1];
    }
    return forms[2];
  };

  if (absMinutes < 1) {
    return locale === 'ru' ? 'менее минуты' : 'less than a minute';
  }

  if (absMinutes < 60) {
    if (locale === 'ru') {
      return `${diffMinutes > 0 ? 'через' : 'назад'} ${absMinutes} ${pluralize(absMinutes, ['минуту', 'минуты', 'минут'])}`;
    }
    return `${diffMinutes > 0 ? 'in' : ''} ${absMinutes} ${absMinutes === 1 ? 'minute' : 'minutes'}${diffMinutes < 0 ? ' ago' : ''}`.trim();
  }

  const hours = Math.round(absMinutes / 60);
  if (locale === 'ru') {
    return `${diffMinutes > 0 ? 'через' : 'назад'} ${hours} ${pluralize(hours, ['час', 'часа', 'часов'])}`;
  }
  return `${diffMinutes > 0 ? 'in' : ''} ${hours} ${hours === 1 ? 'hour' : 'hours'}${diffMinutes < 0 ? ' ago' : ''}`.trim();
}

function statusBadgeVariant(status: EventStatus): 'success' | 'warning' | 'default' {
  switch (status) {
    case 'live':
      return 'success';
    case 'upcoming':
      return 'warning';
    default:
      return 'default';
  }
}

export function EventSchedule({ events, locale, timezone, onSelectEvent }: EventScheduleProps) {
  const resolvedLocale = resolveLocale(locale);
  const localeKey = resolvedLocale === 'ru' ? 'ru-RU' : 'en-US';

  const now = useMemo(() => new Date(), []);
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeKey, {
        month: 'short',
        day: 'numeric',
        timeZone: timezone,
      }),
    [localeKey, timezone]
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeKey, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone,
      }),
    [localeKey, timezone]
  );

  return (
    <Panel tone="overlayStrong" spacing="md" padding="lg" className="gap-4">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Text variant="title" weight="semibold">
            {resolvedLocale === 'ru' ? 'Расписание событий' : 'Event Schedule'}
          </Text>
          <Text variant="bodySm" tone="secondary">
            {resolvedLocale === 'ru'
              ? 'Следите за PvP событиями и сезонными активностями.'
              : 'Stay on top of PvP events and seasonal activities.'}
          </Text>
        </div>
        <Badge variant="primary" size="sm">
          UTC{timezone ? ` · ${timezone}` : ''}
        </Badge>
      </header>

      <div className="flex flex-col gap-3">
        {events.map(event => {
          const startDate = toDate(event.startsAt);
          const endDate = toDate(event.endsAt);
          const status = resolveStatus(now, startDate, endDate);
          const relative = formatRelativeLabel(now, startDate, resolvedLocale);

          return (
            <button
              type="button"
              key={event.id}
              onClick={() => onSelectEvent?.(event.id)}
              className={clsx(
                'text-left transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary',
                event.highlight ? 'hover:-translate-y-0.5' : 'hover:-translate-y-0.5'
              )}
            >
              <Panel
                tone={event.highlight ? 'accent' : 'overlay'}
                border={event.highlight ? 'accent' : 'subtle'}
                spacing="sm"
                padding="lg"
                className={clsx(
                  'w-full gap-3',
                  event.highlight ? 'text-text-inverse shadow-elevation-2' : 'text-text-primary'
                )}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="epic" size="sm">
                      {KIND_LABEL[resolvedLocale][event.kind]}
                    </Badge>
                    <Text as="span" variant="body" weight="semibold">
                      {event.title}
                    </Text>
                  </div>
                  <Badge variant={statusBadgeVariant(status)} size="sm">
                    {STATUS_LABEL[resolvedLocale][status]}
                  </Badge>
                </div>

                <Text variant="bodySm" tone={event.highlight ? 'inverse' : 'secondary'}>
                  {event.description}
                </Text>

                <div className="flex flex-wrap items-center gap-3 text-caption">
                  <span className="rounded-full border border-border-layer px-3 py-1">
                    {formatRange(startDate, endDate, dateFormatter, timeFormatter)}
                  </span>
                  <span className="text-text-secondary">{relative}</span>
                  <span className="rounded-full border border-border-layer px-3 py-1">
                    {event.rewardSummary}
                  </span>
                </div>
              </Panel>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
