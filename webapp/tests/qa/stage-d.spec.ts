import { test, expect, Page } from '@playwright/test';

const mockSessionResponse = {
  user: {
    id: 'user-1',
    username: 'test-user',
  },
  progress: {
    level: 10,
    xp: 2_500,
    xp_into_level: 300,
    xp_to_next_level: 700,
    energy: 5_000,
    tap_level: 3,
    tap_income: 45,
    passive_income_per_sec: 120,
    passive_income_multiplier: 1,
    total_energy_produced: 25_000,
  },
  offline_gains: null,
  inventory: [],
};

const mockProfileResponse = {
  user: {
    id: 'user-1',
    telegram_id: 1,
    username: 'test-user',
    first_name: 'Test',
    last_name: 'User',
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
    xp: 2_500,
    xp_into_level: 300,
    xp_to_next_level: 700,
    total_energy_produced: 25_000,
    energy: 5_000,
    tap_level: 3,
    tap_income: 45,
    passive_income_per_sec: 120,
    passive_income_multiplier: 1,
    last_login: new Date().toISOString(),
    last_logout: null,
  },
  boosts: [],
  buildings: [],
};

type StageMockOptions = {
  leaderboard?: Array<{
    rank: number;
    user_id: string;
    telegram_id: number;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    level: number;
    total_energy_produced: number;
  }>;
  starPackError?: boolean;
};

async function setupStageMocks(page: Page, options: StageMockOptions = {}) {
  const leaderboard = options.leaderboard ?? [
    {
      rank: 1,
      user_id: 'u-top',
      telegram_id: 2,
      username: 'top-player',
      first_name: 'Top',
      last_name: 'Player',
      level: 25,
      total_energy_produced: 150_000,
    },
  ];

  await page.route('**/api/v1/**', async route => {
    const { url, method } = route.request();
    const { pathname } = new URL(url);

    const fulfillJson = (status: number, payload: unknown) =>
      route.fulfill({
        status,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

    if (pathname.endsWith('/auth/telegram') && method === 'POST') {
      await fulfillJson(200, { access_token: 'mock-token', refresh_token: 'mock-refresh' });
      return;
    }

    if (pathname.endsWith('/session') && method === 'POST') {
      await fulfillJson(200, mockSessionResponse);
      return;
    }

    if (pathname.startsWith('/api/v1/profile') && method === 'GET') {
      await fulfillJson(200, mockProfileResponse);
      return;
    }

    if (pathname.endsWith('/leaderboard') && method === 'GET') {
      await fulfillJson(200, {
        leaderboard,
        total_players: leaderboard.length,
        user_rank: leaderboard.find(entry => entry.user_id === 'user-1')?.rank ?? null,
        user_entry: leaderboard.find(entry => entry.user_id === 'user-1') ?? null,
      });
      return;
    }

    if (pathname.endsWith('/purchase/packs') && method === 'GET') {
      if (options.starPackError) {
        await route.fulfill({
          status: 500,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ message: 'service error' }),
        });
      } else {
        await fulfillJson(200, {
          packs: [
            {
              id: 'starter-pack',
              title: 'Starter Pack',
              description: 'Small boost to kick things off',
              stars: 500,
              bonus_stars: 50,
              price_rub: 199,
              icon_url: null,
              featured: true,
            },
          ],
        });
      }
      return;
    }

    if (pathname.endsWith('/cosmetics') && method === 'GET') {
      await fulfillJson(200, { cosmetics: [] });
      return;
    }

    if (pathname.endsWith('/boost') && method === 'GET') {
      await fulfillJson(200, { boosts: [] });
      return;
    }

    if (pathname.endsWith('/buildings') && method === 'GET') {
      await fulfillJson(200, { buildings: [] });
      return;
    }

    if (pathname.endsWith('/referrals') && method === 'GET') {
      await fulfillJson(200, {
        referral: {
          code: 'ABCDE1',
          share_url: 'https://t.me/energyplanetbot?start=ABCDE1',
          invitee_reward: { stars: 100, multiplier: 1 },
          referrer_reward: { stars: 200, multiplier: 1.2 },
          total_activations: 0,
          daily_activations: { used: 0, limit: 3 },
          milestones: [],
          active_events: [],
          stats: {
            total_rewards_claimed: 0,
            daily_rewards_used: 0,
            daily_reward_limit: 3,
          },
          revenue_share: null,
          revenue: {
            total_earned: 0,
            month_earned: 0,
            today_earned: 0,
            updated_at: new Date().toISOString(),
          },
          last_updated: new Date().toISOString(),
        },
      });
      return;
    }

    if (pathname.endsWith('/referrals/revenue') && method === 'GET') {
      await fulfillJson(200, {
        revenue: {
          revenue_share: null,
          totals: { all_time: 0, month: 0, today: 0 },
          recent: [],
          friends: [],
          updated_at: new Date().toISOString(),
        },
      });
      return;
    }

    if (pathname.endsWith('/achievements') && method === 'GET') {
      await fulfillJson(200, { achievements: [] });
      return;
    }

    if (pathname.endsWith('/prestige') && method === 'GET') {
      await fulfillJson(200, {
        prestige_level: 0,
        prestige_multiplier: 1,
        energy_since_reset: 0,
        next_threshold: 100_000,
        gain_available: 0,
      });
      return;
    }

    if (pathname.endsWith('/quests') && method === 'GET') {
      await fulfillJson(200, { quests: [] });
      return;
    }

    if (pathname.includes('/telemetry/client')) {
      await fulfillJson(202, {});
      return;
    }

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 200 });
      return;
    }

    await fulfillJson(200, {});
  });
}

test.describe('Stage D QA automation', () => {
  test('Leaderboard empty state renders friendly fallback', async ({ page }) => {
    await setupStageMocks(page, { leaderboard: [] });

    await page.goto('/friends');

    await expect(page.getByRole('heading', { name: 'Топ игроков' })).toBeVisible();
    await expect(
      page.getByText('Таблица пустая — станьте первым, кто произведёт энергию и попадёт в топ!')
    ).toBeVisible();
  });

  test('Shop surfaces error state when packs fail to load', async ({ page }) => {
    await setupStageMocks(page, { starPackError: true });

    await page.goto('/exchange?section=star_packs');

    await expect(page.getByText('Не удалось загрузить паки Stars')).toBeVisible();
  });
});
