import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { ChatScreen } from './ChatScreen';

const meta: Meta<typeof ChatScreen> = {
  title: 'Screens/ChatScreen',
  component: ChatScreen,
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

type Story = StoryObj<typeof ChatScreen>;

function ChatScreenPreview() {
  return (
    <MemoryRouter initialEntries={['/chat']}>
      <ChatScreen />
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => <ChatScreenPreview />,
};
