import { useMemo } from 'react';
import { TabPageSurface, MatchLobby, EventSchedule } from '@/components';

export function PvPEventsScreen() {
  const modes = useMemo(
    () => [
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
    ],
    []
  );

  const now = useMemo(() => new Date(), []);

  const events = useMemo(() => {
    const addHours = (hours: number) => new Date(now.getTime() + hours * 3600 * 1000).toISOString();
    return [
      {
        id: 'raid-1',
        title: 'Рейд «Гравитационный шторм»',
        description: 'Совместное испытание на 6 игроков. Сдержите волны дронов.',
        startsAt: addHours(1),
        endsAt: addHours(3),
        kind: 'raid' as const,
        rewardSummary: 'x3 рейдовых ключа · легендарный шард',
        highlight: true,
      },
      {
        id: 'duel-cup',
        title: 'PvP Duel Cup',
        description: 'Мини-турнир на 8 участников с double elimination.',
        startsAt: addHours(-2),
        endsAt: addHours(1),
        kind: 'tournament' as const,
        rewardSummary: 'Скин «Звёздный дуэлянт» · 750 League XP',
      },
      {
        id: 'quest-boost',
        title: 'Квесты «Осенняя энергия»',
        description: 'Тематика осеннего сезона — повышенные награды и особые бусты.',
        startsAt: addHours(6),
        endsAt: addHours(30),
        kind: 'quest' as const,
        rewardSummary: '+15% Stars к покупкам · тематические стикеры',
      },
    ];
  }, [now]);

  return (
    <TabPageSurface className="gap-6">
      <MatchLobby modes={modes} friendsOnline={18} dailyBonus="+25% league XP" streakDays={4} />
      <EventSchedule events={events} locale="ru" timezone="Europe/Moscow" />
    </TabPageSurface>
  );
}
