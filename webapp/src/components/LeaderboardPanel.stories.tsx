import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { LeaderboardPanel } from './LeaderboardPanel';
import { useGameStore } from '@/store/gameStore';
import type { LeaderboardUserEntry } from '@/services/leaderboard';

const meta: Meta<typeof LeaderboardPanel> = {
  title: 'Leaderboards/LeaderboardPanel',
  component: LeaderboardPanel,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: 'var(--color-bg-primary)' },
        { name: 'light', value: '#f4f4f4' },
      ],
    },
  },
};

export default meta;

type Story = StoryObj<typeof LeaderboardPanel>;

const SAMPLE_ENTRIES: LeaderboardUserEntry[] = Array.from({ length: 10 }).map((_, index) => ({
  rank: index + 1,
  user_id: `user-${index + 1}`,
  telegram_id: index + 1000,
  username: `Игрок_${index + 1}`,
  first_name: `Игрок`,
  last_name: `${index + 1}`,
  level: 20 + index,
  total_energy_produced: 25_000_000 + (10 - index) * 1_200_000,
  equipped_avatar_frame: index < 3 ? 'premium_frame' : null,
}));

function LeaderboardPanelStory() {
  useEffect(() => {
    const initial = useGameStore.getState();
    const cleanupState = {
      leaderboardEntries: initial.leaderboardEntries,
      leaderboardLoaded: initial.leaderboardLoaded,
      isLeaderboardLoading: initial.isLeaderboardLoading,
      leaderboardError: initial.leaderboardError,
      leaderboardTotal: initial.leaderboardTotal,
      userLeaderboardEntry: initial.userLeaderboardEntry,
      userId: initial.userId,
    };

    useGameStore.setState({
      leaderboardEntries: SAMPLE_ENTRIES,
      leaderboardLoaded: true,
      isLeaderboardLoading: false,
      leaderboardError: null,
      leaderboardTotal: 2500,
      userLeaderboardEntry: SAMPLE_ENTRIES[4],
      userId: SAMPLE_ENTRIES[4].user_id,
    });

    return () => {
      useGameStore.setState(cleanupState);
    };
  }, []);

  return <LeaderboardPanel />;
}

export const Default: Story = {
  render: () => <LeaderboardPanelStory />,
};

function EmptyLeaderboardStory() {
  useEffect(() => {
    const initial = useGameStore.getState();
    const cleanupState = {
      leaderboardEntries: initial.leaderboardEntries,
      leaderboardLoaded: initial.leaderboardLoaded,
      isLeaderboardLoading: initial.isLeaderboardLoading,
      leaderboardError: initial.leaderboardError,
      leaderboardTotal: initial.leaderboardTotal,
      userLeaderboardEntry: initial.userLeaderboardEntry,
      userId: initial.userId,
    };

    useGameStore.setState({
      leaderboardEntries: [],
      leaderboardLoaded: true,
      isLeaderboardLoading: false,
      leaderboardError: null,
      leaderboardTotal: 0,
      userLeaderboardEntry: null,
      userId: 'user-empty',
    });

    return () => {
      useGameStore.setState(cleanupState);
    };
  }, []);

  return <LeaderboardPanel />;
}

export const EmptyState: Story = {
  render: () => <EmptyLeaderboardStory />,
};

function ErrorLeaderboardStory() {
  useEffect(() => {
    const initial = useGameStore.getState();
    const cleanupState = {
      leaderboardEntries: initial.leaderboardEntries,
      leaderboardLoaded: initial.leaderboardLoaded,
      isLeaderboardLoading: initial.isLeaderboardLoading,
      leaderboardError: initial.leaderboardError,
      leaderboardTotal: initial.leaderboardTotal,
      userLeaderboardEntry: initial.userLeaderboardEntry,
      userId: initial.userId,
    };

    useGameStore.setState({
      leaderboardEntries: [],
      leaderboardLoaded: true,
      isLeaderboardLoading: false,
      leaderboardError: 'Service unavailable: 503',
      leaderboardTotal: 0,
      userLeaderboardEntry: null,
      userId: 'user-error',
    });

    return () => {
      useGameStore.setState(cleanupState);
    };
  }, []);

  return <LeaderboardPanel />;
}

export const ErrorState: Story = {
  render: () => <ErrorLeaderboardStory />,
};
