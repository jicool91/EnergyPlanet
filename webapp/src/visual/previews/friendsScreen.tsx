import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { FriendsScreen } from '@/screens/FriendsScreen';
import { useGameStore } from '@/store/gameStore';
import { useAuthStore } from '@/store/authStore';
import { useReferralStore } from '@/store/referralStore';
import { useReferralRevenueStore } from '@/store/referralRevenueStore';
import '@/index.css';
import type { LeaderboardUserEntry } from '@/services/leaderboard';
import type { ProfileResponse } from '@/services/profile';

export const friendsLeaderboardMock: LeaderboardUserEntry[] = [
  {
    rank: 1,
    user_id: 'u-top',
    telegram_id: 1001,
    username: 'top_player',
    first_name: 'Top',
    last_name: 'Player',
    level: 42,
    total_energy_produced: 250_000,
    equipped_avatar_frame: null,
  },
  {
    rank: 2,
    user_id: 'user-1',
    telegram_id: 1000,
    username: 'designer',
    first_name: 'UI',
    last_name: 'Designer',
    level: 36,
    total_energy_produced: 200_000,
    equipped_avatar_frame: null,
  },
  {
    rank: 3,
    user_id: 'u-ally',
    telegram_id: 1002,
    username: 'ally_cat',
    first_name: 'Ally',
    last_name: 'Cat',
    level: 28,
    total_energy_produced: 150_500,
    equipped_avatar_frame: null,
  },
];

export const friendsProfileMock: ProfileResponse = {
  user: {
    id: 'user-1',
    telegram_id: 1000,
    username: 'designer',
    first_name: 'UI',
    last_name: 'Designer',
    is_admin: false,
  },
  profile: {
    equipped_avatar_frame: null,
    equipped_planet_skin: null,
    equipped_tap_effect: null,
    equipped_background: null,
    bio: 'Создаю лучшие энергопланеты',
    is_public: true,
    updated_at: new Date().toISOString(),
  },
  progress: {
    level: 36,
    xp: 12_500,
    xp_into_level: 450,
    xp_to_next_level: 850,
    total_energy_produced: 200_000,
    energy: 18_250,
    tap_level: 7,
    tap_income: 120,
    passive_income_per_sec: 420,
    passive_income_multiplier: 1.4,
    boost_multiplier: 1.2,
    prestige_multiplier: 1.05,
    prestige_level: 3,
    prestige_energy_since_reset: 12_000,
    prestige_last_reset: new Date().toISOString(),
    last_login: new Date().toISOString(),
    last_logout: null,
  },
  boosts: [],
  buildings: [],
  referral: {
    total_invites: 12,
    daily_invites_used: 2,
    daily_invites_limit: 5,
    referred_by: null,
  },
};

let initialized = false;

function bootstrapFriendsPreviewState() {
  if (initialized) {
    return;
  }
  initialized = true;

  useAuthStore.setState(state => ({
    ...state,
    accessToken: 'preview-token',
    refreshToken: 'preview-refresh',
    refreshExpiresAt: Date.now() + 3600 * 1000,
    hydrated: true,
    authReady: true,
    bootstrapping: false,
    bootstrapNonce: 0,
  }));

  useGameStore.setState({
    loadLeaderboard: async () => Promise.resolve(),
    loadProfile: async () => Promise.resolve(),
  });

  useGameStore.setState({
    leaderboardEntries: friendsLeaderboardMock,
    leaderboardTotal: 128,
    leaderboardLoaded: true,
    isLeaderboardLoading: false,
    leaderboardError: null,
    userLeaderboardEntry: friendsLeaderboardMock[1],
    profile: friendsProfileMock,
    isProfileLoading: false,
    profileError: null,
  });

  useReferralStore.setState(state => ({
    ...state,
    referral: {
      code: 'FRIENDS',
      shareUrl: 'https://t.me/energy_planet_bot?start=ref_FRIENDS',
      inviteeReward: {
        stars: 50,
        effectiveStars: 50,
        multiplier: 1,
      },
      referrerReward: {
        stars: 100,
        effectiveStars: 110,
        multiplier: 1.1,
      },
      totalActivations: 12,
      dailyActivations: { used: 0, limit: 3 },
      milestones: [],
      activeEvents: [],
      stats: {
        totalRewardsClaimed: 420,
        dailyRewardsUsed: 1,
        dailyRewardLimit: 5,
      },
      revenueShare: null,
      revenue: {
        totalEarned: 0,
        monthEarned: 0,
        todayEarned: 0,
        lastUpdated: new Date().toISOString(),
      },
      referredBy: null,
      lastUpdated: new Date().toISOString(),
    },
    loadSummary: async () => Promise.resolve(),
    isLoading: false,
    isUpdating: false,
    error: null,
  }));

  useReferralRevenueStore.setState(state => ({
    ...state,
    overview: {
      totals: { allTime: 320, month: 80, today: 12 },
      recent: [],
      friends: [],
      revenueShare: null,
      updatedAt: new Date().toISOString(),
    },
    isLoading: false,
    error: null,
    loadOverview: async () => Promise.resolve(),
  }));
}

function FriendsPreviewScene() {
  bootstrapFriendsPreviewState();

  return (
    <MemoryRouter initialEntries={['/friends']}>
      <div className="min-h-screen w-full bg-surface-primary px-4 py-6 text-text-primary">
        <FriendsScreen />
      </div>
    </MemoryRouter>
  );
}

export function renderFriendsPreview(container: HTMLElement, params: URLSearchParams) {
  const theme = params.get('theme');
  if (theme === 'light') {
    document.documentElement.style.colorScheme = 'light';
    document.documentElement.dataset.previewTheme = 'light';
  } else {
    document.documentElement.style.colorScheme = 'dark';
    document.documentElement.dataset.previewTheme = 'dark';
  }
  document.body.style.background = 'var(--color-bg-primary)';

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <FriendsPreviewScene />
    </StrictMode>
  );
}
