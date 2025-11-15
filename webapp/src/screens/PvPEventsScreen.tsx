import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabPageSurface, MatchLobby, EventSchedule, Surface, Text, Button } from '@/components';
import type { LobbyMode } from '@/components/pvp/MatchLobby';
import type { EventScheduleEntry } from '@/components/events/EventSchedule';
import { useNotification } from '@/hooks/useNotification';
import { useExperimentVariant } from '@/store/experimentsStore';
import { fetchPvPEventsPayload, joinPvPQueue, schedulePvPEventReminder } from '@/services/events';

const fallbackModes: LobbyMode[] = [
  {
    id: 'duel',
    name: 'Дуэль 1 на 1',
    description: 'Поднимайтесь по лиге, побеждая соперников похожего рейтинга.',
    icon: '⚔️',
    queueEstimate: '≈ 45 сек.',
    queueSize: 136,
    mapName: 'Цитадель неона',
    rewards: ['+250 League XP', 'Сундук дуэлянта'],
    recommended: true,
    mapPreviewUrl:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'trio',
    name: 'Трио рейды',
    description: 'Соберите команду из 3 человек, удерживайте контрольные точки.',
    icon: '🛡️',
    queueEstimate: '≈ 2 мин.',
    queueSize: 84,
    mapName: 'Орбита-9',
    rewards: ['Рейдовый ключ', 'x2 Шардов'],
  },
  {
    id: 'storm',
    name: 'Солнечная буря',
    description: '12 игроков, динамический шторм, ускоренные усиления.',
    icon: '🌪️',
    queueEstimate: '≈ 3 мин.',
    queueSize: 40,
    mapName: 'Плато Светоча',
    rewards: ['Эмблема сезона', 'Премиум косметика'],
  },
];

function buildFallbackEvents(): EventScheduleEntry[] {
  const now = Date.now();
  const hours = (offset: number) => new Date(now + offset * 3600 * 1000).toISOString();
  return [
    {
      id: 'raid-1',
      title: 'Рейд «Гравитационный шторм»',
      description: 'Совместное испытание на 6 игроков. Сдержите волны дронов.',
      startsAt: hours(1),
      endsAt: hours(3),
      kind: 'raid',
      rewardSummary: 'x3 рейдовых ключа · легендарный шард',
      highlight: true,
    },
    {
      id: 'duel-cup',
      title: 'PvP Duel Cup',
      description: 'Мини-турнир на 8 участников с double elimination.',
      startsAt: hours(-2),
      endsAt: hours(1),
      kind: 'tournament',
      rewardSummary: 'Скин «Звёздный дуэлянт» · 750 League XP',
    },
    {
      id: 'quest-boost',
      title: 'Квесты «Осенняя энергия»',
      description: 'Тематика осеннего сезона — повышенные награды и особые бусты.',
      startsAt: hours(6),
      endsAt: hours(30),
      kind: 'quest',
      rewardSummary: '+15% Stars к покупкам · тематические стикеры',
    },
  ];
}

export function PvPEventsScreen() {
  const { success: notifySuccess, error: notifyError } = useNotification();
  const fallbackEvents = useMemo(() => buildFallbackEvents(), []);
  const [modes, setModes] = useState<LobbyMode[]>(fallbackModes);
  const [events, setEvents] = useState<EventScheduleEntry[]>(fallbackEvents);
  const [friendsOnline, setFriendsOnline] = useState(18);
  const [dailyBonus, setDailyBonus] = useState<string | undefined>('+25% league XP');
  const [streakDays, setStreakDays] = useState<number | undefined>(4);
  const [timezone, setTimezone] = useState<string>('Europe/Moscow');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const variant = useExperimentVariant('pvp_events_v1');
  const eventsEnabled = (variant ?? 'enabled') !== 'disabled';

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchPvPEventsPayload();
      setModes(payload.modes.length ? payload.modes : fallbackModes);
      setEvents(payload.events.length ? payload.events : fallbackEvents);
      setFriendsOnline(payload.friendsOnline);
      setDailyBonus(payload.dailyBonus ?? undefined);
      setStreakDays(payload.streakDays ?? undefined);
      setTimezone(payload.timezone ?? 'Europe/Moscow');
    } catch (err) {
      console.error('Failed to load PvP events', err);
      setModes(fallbackModes);
      setEvents(fallbackEvents);
      setTimezone('Europe/Moscow');
      setError('Не удалось загрузить PvP события — показываем шаблон.');
    } finally {
      setLoading(false);
    }
  }, [fallbackEvents]);

  useEffect(() => {
    loadEvents().catch(() => undefined);
  }, [loadEvents]);

  const handleJoinQueue = useCallback(
    (modeId: string) => {
      joinPvPQueue(modeId)
        .then(() => {
          notifySuccess('Вы встали в очередь режима');
        })
        .catch(err => {
          console.error('Failed to join PvP queue', err);
          notifyError('Не удалось встать в очередь — попробуйте позже');
        });
    },
    [notifyError, notifySuccess]
  );

  const handleEventReminder = useCallback(
    (eventId: string) => {
      schedulePvPEventReminder(eventId)
        .then(() => notifySuccess('Добавили напоминание о событии'))
        .catch(err => {
          console.error('Failed to set PvP reminder', err);
          notifyError('Не удалось добавить напоминание');
        });
    },
    [notifyError, notifySuccess]
  );

  if (!eventsEnabled) {
    return (
      <TabPageSurface className="gap-6">
        <Surface
          tone="secondary"
          border="subtle"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="text-body text-text-secondary"
        >
          PvP события временно выключены для вашего сегмента. Мы включим вкладку как только
          убедимся, что матчмейкинг стабилен.
        </Surface>
      </TabPageSurface>
    );
  }

  return (
    <TabPageSurface className="gap-6">
      {error && (
        <Surface
          tone="secondary"
          border="strong"
          elevation="soft"
          padding="lg"
          rounded="3xl"
          className="flex flex-col gap-3"
        >
          <Text variant="body" tone="danger">
            {error}
          </Text>
          <Button variant="secondary" size="sm" onClick={loadEvents} disabled={loading}>
            Повторить
          </Button>
        </Surface>
      )}
      <MatchLobby
        modes={modes}
        friendsOnline={friendsOnline}
        dailyBonus={dailyBonus}
        streakDays={streakDays}
        onJoinQueue={handleJoinQueue}
      />
      <EventSchedule
        events={events}
        locale="ru"
        timezone={timezone}
        onSelectEvent={handleEventReminder}
      />
    </TabPageSurface>
  );
}
