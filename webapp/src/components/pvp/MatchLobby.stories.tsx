import type { Meta, StoryObj } from '@storybook/react';
import { MatchLobby } from './MatchLobby';

const meta: Meta<typeof MatchLobby> = {
  title: 'PvP/MatchLobby',
  component: MatchLobby,
  args: {
    friendsOnline: 12,
    dailyBonus: '+25% league XP',
    streakDays: 3,
  },
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'var(--color-bg-primary)' },
        { name: 'light', value: '#f7f7f7' },
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof MatchLobby>;

const MODES = [
  {
    id: 'duel',
    name: 'Дуэль 1 на 1',
    description: 'Классический формат: победи соперника и поднимись по дивизионам.',
    icon: '⚔️',
    rewards: ['+250 League XP', 'Сундук дуэлянта'],
    queueEstimate: '≈ 40 сек.',
    queueSize: 120,
    mapName: 'Цитадель неона',
    recommended: true,
  },
  {
    id: 'trio',
    name: 'Трио-рейды',
    description: 'Командная активность на время: соберите группу и удерживайте точки.',
    icon: '🛡️',
    rewards: ['Рейдовый ключ', 'x2 Шардов'],
    queueEstimate: '≈ 2 мин.',
    queueSize: 86,
    mapName: 'Сектор Орбита',
  },
  {
    id: 'royale',
    name: 'Солнечная буря',
    description: '12 игроков, таймер сжатия зоны и случайные модификаторы.',
    icon: '🌪️',
    rewards: ['Эмблема сезона', 'Премиум косметика'],
    queueEstimate: '≈ 3 мин.',
    queueSize: 42,
    mapName: 'Плато Светоча',
  },
];

export const Default: Story = {
  args: {
    modes: MODES,
  },
};

export const WithMapPreview: Story = {
  args: {
    modes: [
      {
        ...MODES[0],
        mapPreviewUrl:
          'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80',
      },
      ...MODES.slice(1),
    ],
    defaultModeId: 'duel',
    streakDays: 5,
  },
};
