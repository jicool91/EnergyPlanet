import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { ChatScreen } from './ChatScreen';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { useChatStore, type ChatMessageState } from '@/store/chatStore';
import type { ProfileResponse } from '@/services/profile';

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

const demoProfile: ProfileResponse = {
  user: {
    id: 'demo-user',
    telegram_id: 424242,
    username: 'demo',
    first_name: 'Demo',
    last_name: 'Player',
    is_admin: false,
  },
  profile: {
    equipped_avatar_frame: null,
    equipped_planet_skin: null,
    equipped_tap_effect: null,
    equipped_background: null,
    bio: 'Demo astronaut',
    is_public: true,
    updated_at: new Date().toISOString(),
  },
  progress: {
    level: 27,
    xp: 0,
    xp_into_level: 0,
    xp_to_next_level: 100,
    total_energy_produced: 0,
    energy: 0,
    tap_level: 5,
    tap_income: 120,
    passive_income_per_sec: 0,
    passive_income_multiplier: 1,
    boost_multiplier: 1,
    prestige_multiplier: 1,
    prestige_level: 0,
    prestige_energy_since_reset: 0,
    prestige_last_reset: null,
    last_login: null,
    last_logout: null,
  },
  boosts: [],
  buildings: [],
  referral: null,
};

const sampleMessages: ChatMessageState[] = [
  {
    id: 'msg-1',
    message: 'Добро пожаловать в Energy Planet! 🚀',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    client_message_id: null,
    author: {
      user_id: 'pilot-1',
      telegram_id: 5001,
      username: 'captain',
      first_name: 'Captain',
      last_name: 'Solar',
      level: 42,
      equipped_avatar_frame: null,
    },
  },
  {
    id: 'msg-2',
    message: 'Собираем команду на рейд в 20:00. Кто с нами?',
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    client_message_id: null,
    author: {
      user_id: 'pilot-2',
      telegram_id: 5002,
      username: null,
      first_name: 'Lena',
      last_name: 'Nova',
      level: 21,
      equipped_avatar_frame: null,
    },
  },
];

function ChatScreenPreview() {
  useEffect(() => {
    useAuthStore.setState(state => ({ ...state, authReady: true }));
    useGameStore.setState(state => ({
      ...state,
      userId: 'demo-user',
      username: 'demo',
      level: 27,
      profile: demoProfile,
    }));
    useChatStore.setState(state => ({
      ...state,
      messages: sampleMessages,
      isLoading: false,
      initialized: true,
      hasMore: true,
      nextCursor: null,
      latestCursor: sampleMessages.length ? sampleMessages[sampleMessages.length - 1].id : null,
    }));

    return () => {
      useChatStore.getState().reset();
    };
  }, []);

  return (
    <MemoryRouter initialEntries={['/chat']}>
      <ChatScreen />
    </MemoryRouter>
  );
}

export const Default: Story = {
  render: () => <ChatScreenPreview />,
};
