import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { ChatScreen } from '@/screens/ChatScreen';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';
import { useChatStore, type ChatMessageState } from '@/store/chatStore';
import type { ProfileResponse } from '@/services/profile';

const previewProfile: ProfileResponse = {
  user: {
    id: 'preview-user',
    telegram_id: 123456,
    username: 'preview',
    first_name: 'Preview',
    last_name: 'Pilot',
    is_admin: false,
  },
  profile: {
    equipped_avatar_frame: null,
    equipped_planet_skin: null,
    equipped_tap_effect: null,
    equipped_background: null,
    bio: null,
    is_public: true,
    updated_at: new Date().toISOString(),
  },
  progress: {
    level: 10,
    xp: 0,
    xp_into_level: 0,
    xp_to_next_level: 100,
    total_energy_produced: 0,
    energy: 0,
    tap_level: 1,
    tap_income: 10,
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

const previewMessages: ChatMessageState[] = [
  {
    id: 'preview-1',
    message: 'Приветствуем всех космонавтов Energy Planet! 🚀',
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    client_message_id: null,
    author: {
      user_id: 'preview-ally',
      telegram_id: 8888,
      username: 'ally',
      first_name: 'Allison',
      last_name: 'Ray',
      level: 34,
      equipped_avatar_frame: null,
    },
  },
  {
    id: 'preview-2',
    message: 'Апгрейднул мегабур и теперь фармлю по 2x. Делитесь своими билдами 👇',
    created_at: new Date(Date.now() - 1000 * 60).toISOString(),
    client_message_id: null,
    author: {
      user_id: 'preview-user',
      telegram_id: 123456,
      username: 'preview',
      first_name: 'Preview',
      last_name: 'Pilot',
      level: 10,
      equipped_avatar_frame: null,
    },
  },
];

function ChatPreviewProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    useAuthStore.setState(state => ({ ...state, authReady: true }));
    useGameStore.setState(state => ({
      ...state,
      userId: 'preview-user',
      username: 'preview',
      level: 10,
      profile: previewProfile,
    }));
    useChatStore.setState(state => ({
      ...state,
      messages: previewMessages,
      isLoading: false,
      initialized: true,
      hasMore: false,
      nextCursor: null,
      latestCursor: previewMessages.length ? previewMessages[previewMessages.length - 1].id : null,
    }));
    return () => {
      useChatStore.getState().reset();
    };
  }, []);

  return <>{children}</>;
}

export function renderChatPreview(container: HTMLElement, _params: URLSearchParams) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <MemoryRouter initialEntries={['/chat']}>
        <ChatPreviewProviders>
          <ChatScreen />
        </ChatPreviewProviders>
      </MemoryRouter>
    </StrictMode>
  );
}
