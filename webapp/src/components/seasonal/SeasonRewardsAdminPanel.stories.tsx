import type { Meta, StoryObj } from '@storybook/react';
import { SeasonRewardsAdminPanel } from './SeasonRewardsAdminPanel';
import { NotificationContainer } from '@/components';

const meta: Meta<typeof SeasonRewardsAdminPanel> = {
  title: 'Seasonal/SeasonRewardsAdminPanel',
  component: SeasonRewardsAdminPanel,
  args: {
    seasonTitle: 'Октябрь 2025',
    seasonId: '2025-10',
    endedAt: new Date('2025-10-31T21:00:00Z').toISOString(),
    snapshotPlayers: [
      {
        rank: 1,
        userId: 'season-user-1',
        player: 'Лилия 🌟',
        energyTotal: 38_200_000,
        rewardStatus: 'pending',
        rewardTier: 'gold',
        couponCode: null,
      },
      {
        rank: 2,
        userId: 'season-user-2',
        player: 'Stormrider',
        energyTotal: 31_500_000,
        rewardStatus: 'pending',
        rewardTier: 'silver',
        couponCode: null,
      },
      {
        rank: 3,
        userId: 'season-user-3',
        player: 'QuantumFox',
        energyTotal: 28_100_000,
        rewardStatus: 'granted',
        rewardTier: 'bronze',
        couponCode: 'WB-FOX-2025',
      },
    ],
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'var(--color-bg-primary)' },
        { name: 'light', value: '#f8f8f8' },
      ],
    },
  },
  decorators: [
    StoryFn => (
      <>
        <StoryFn />
        <NotificationContainer />
      </>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SeasonRewardsAdminPanel>;

export const Default: Story = {};

export const Processing: Story = {
  args: {
    isProcessing: true,
  },
};
