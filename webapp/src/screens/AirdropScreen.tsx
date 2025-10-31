import { TabPageSurface, ClanComingSoon, AirdropTimeline } from '@/components';

const SAMPLE_EVENTS = [
  {
    id: 'meteor-shower',
    title: 'Метеорный дождь',
    description: 'Собирайте метеоры, чтобы получить редкие бусты и дополнительные Stars.',
    startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: 'upcoming' as const,
    reward: '+50% пассивного дохода на 12 часов',
  },
  {
    id: 'solar-flare',
    title: 'Солнечная вспышка',
    description: '24-часовой челлендж: набей 100k энергии, чтобы забрать эксклюзивный скин.',
    startsAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    status: 'active' as const,
    reward: 'Телеграм-стикер + уникальный тап-эффект',
  },
  {
    id: 'galactic-race',
    title: 'Галактическая гонка',
    description: 'Сезон завершён. Следующий старт в начале месяца.',
    startsAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'finished' as const,
  },
];

export function AirdropScreen() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-heading font-semibold text-[var(--color-text-primary)]">Airdrop</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Сезонные события и будущие коллаборации появятся здесь. Следите за обновлениями!
        </p>
      </header>

      <AirdropTimeline events={SAMPLE_EVENTS} />

      <TabPageSurface className="mt-2">
        <ClanComingSoon />
      </TabPageSurface>
    </div>
  );
}
