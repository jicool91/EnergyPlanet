import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { FriendsScreen } from './FriendsScreen';
import { bootstrapFriendsPreviewState } from '@/visual/previews/friendsScreen';

const meta: Meta<typeof FriendsScreen> = {
  title: 'Screens/FriendsScreen',
  component: FriendsScreen,
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

type Story = StoryObj<typeof FriendsScreen>;

function FriendsScreenPreview() {
  useEffect(() => {
    bootstrapFriendsPreviewState();
  }, []);

  return (
    <MemoryRouter initialEntries={['/friends']}>
      <FriendsScreen />
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => <FriendsScreenPreview />,
};
