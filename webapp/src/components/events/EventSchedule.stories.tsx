import type { Meta, StoryObj } from '@storybook/react';
import { EventSchedule } from './EventSchedule';

const meta: Meta<typeof EventSchedule> = {
  title: 'PvP/EventSchedule',
  component: EventSchedule,
  args: {
    locale: 'ru',
    timezone: 'Europe/Moscow',
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'var(--color-bg-primary)' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof EventSchedule>;

const NOW = new Date();
const addHours = (base: Date, hours: number) => new Date(base.getTime() + hours * 60 * 60 * 1000);

export const Default: Story = {
  args: {
    events: [
      {
        id: 'raid-1',
        title: 'Рейд «Гравитационный шторм»',
        description: 'Совместное испытание на 6 игроков. Сдержите волны дронов и захватите ядро.',
        startsAt: addHours(NOW, 1).toISOString(),
        endsAt: addHours(NOW, 3).toISOString(),
        kind: 'raid',
        rewardSummary: 'x3 рейдовых ключа · 1 легендарный шард',
        highlight: true,
      },
      {
        id: 'duel-cup',
        title: 'PvP Duel Cup',
        description: 'Мини-турнир на 8 участников с системой double elimination.',
        startsAt: addHours(NOW, -2).toISOString(),
        endsAt: addHours(NOW, 1).toISOString(),
        kind: 'tournament',
        rewardSummary: 'Скин «Звёздный дуэлянт» · 750 League XP',
      },
      {
        id: 'quest-boost',
        title: 'Квесты «Осенняя энергия»',
        description: 'Повысьте профит от бустов на 15% и выполните тематические задания.',
        startsAt: addHours(NOW, 6).toISOString(),
        endsAt: addHours(NOW, 30).toISOString(),
        kind: 'quest',
        rewardSummary: '+15% Stars к покупкам · тематические стикеры',
      },
    ],
  },
};

export const English: Story = {
  args: {
    locale: 'en',
    timezone: 'UTC',
    events: [
      {
        id: 'season-rollover',
        title: 'Season rollover',
        description: 'Leaderboard reset with top-100 snapshot and premium coupon payout.',
        startsAt: addHours(NOW, -5).toISOString(),
        endsAt: addHours(NOW, -3).toISOString(),
        kind: 'season',
        rewardSummary: 'Coupons · 1 000 ⭐ · animated avatar frame',
      },
      {
        id: 'pvp-showdown',
        title: 'PvP Showdown Finals',
        description: 'Live broadcasted finals with casters, 12 teams, best-of-3 format.',
        startsAt: addHours(NOW, 2).toISOString(),
        endsAt: addHours(NOW, 4).toISOString(),
        kind: 'tournament',
        rewardSummary: 'Exclusive emote · 2 500 League XP',
        highlight: true,
      },
    ],
  },
};
