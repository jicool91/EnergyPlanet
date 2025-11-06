import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BottomNavigation, type BottomNavigationTab } from './BottomNavigation';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Layout/BottomNavigation',
  component: BottomNavigation,
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
  argTypes: {
    onSelect: { action: 'select' },
  },
};

export default meta;

type Story = StoryObj<typeof BottomNavigation>;

const TABS: BottomNavigationTab[] = [
  { id: 'tap', label: 'Tap', icon: '⚡️', path: '/' },
  { id: 'exchange', label: 'Exchange', icon: '🏢', path: '/exchange' },
  { id: 'chat', label: 'Chat', icon: '💬', path: '/chat', badge: 3 },
  { id: 'friends', label: 'Friends', icon: '🤝', path: '/friends' },
  { id: 'earn', label: 'Earn', icon: '💼', path: '/earn' },
];

function BottomNavigationPlayground() {
  const [activeTab, setActiveTab] = useState<BottomNavigationTab['id']>('tap');

  return (
    <div className="flex min-h-screen items-end justify-center bg-surface-primary p-md">
      <BottomNavigation
        tabs={TABS}
        activeTab={activeTab}
        insetBottom={0}
        onSelect={tab => setActiveTab(tab.id)}
      />
    </div>
  );
}

export const Playground: Story = {
  render: () => <BottomNavigationPlayground />,
};
