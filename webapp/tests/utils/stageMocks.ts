import type { Page } from '@playwright/test';

const MOCK_NOW_ISO = new Date('2025-11-06T09:00:00.000Z').toISOString();
const MOCK_NOW_MS = Date.parse(MOCK_NOW_ISO);

export type StageMockOptions = {
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
  colorScheme?: 'light' | 'dark';
  seasonSnapshot?: SeasonSnapshotMock;
  isAdmin?: boolean;
  safeAreaOverride?: SafeAreaOverrideInput;
  viewportOverride?: ViewportOverrideInput;
  platform?: string;
  injectTelegram?: boolean;
};

type InsetsKeys = 'top' | 'right' | 'bottom' | 'left';

type SafeAreaOverrideInput = {
  safe?: Partial<Record<InsetsKeys, number>>;
  content?: Partial<Record<InsetsKeys, number>>;
};

type ViewportOverrideInput = Partial<{
  height: number;
  stableHeight: number;
  width: number;
  isExpanded: boolean;
  isStateStable: boolean;
  isFullscreen: boolean;
}>;

type SeasonSnapshotMock = {
  seasonId: string;
  seasonNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  rewards: Record<string, unknown>;
  leaderboard: Array<{
    userId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    finalRank: number | null;
    finalElo: number | null;
    finalTier: string | null;
    rewardTier: 'gold' | 'silver' | 'bronze';
    couponCode: string | null;
    rewards: Record<string, unknown>;
    claimed: boolean;
    claimedAt: string | null;
    energyTotal: number;
  }>;
  generatedAt: string;
};

const mockSessionResponse = {
  user: {
    id: 'user-1',
    username: 'test-user',
    is_admin: false,
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
    boost_multiplier: 1.15,
    prestige_multiplier: 1.05,
    achievement_multiplier: 1.1,
    prestige_gain_available: 0,
    prestige_energy_since_reset: 0,
    prestige_energy_to_next: 5000,
    prestige_next_threshold: 5000,
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
    updated_at: MOCK_NOW_ISO,
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
    boost_multiplier: 1.15,
    prestige_multiplier: 1.05,
    achievement_multiplier: 1.1,
    prestige_gain_available: 0,
    prestige_energy_since_reset: 0,
    prestige_energy_to_next: 5000,
    prestige_next_threshold: 5000,
    last_login: MOCK_NOW_ISO,
    last_logout: null,
  },
  boosts: [],
  buildings: [],
};

const defaultSeasonSnapshot: SeasonSnapshotMock = {
  seasonId: 'season-2025-10',
  seasonNumber: 10,
  name: 'Октябрь 2025',
  startTime: '2025-10-01T00:00:00.000Z',
  endTime: '2025-10-31T21:00:00.000Z',
  isActive: false,
  rewards: {
    gold: { coupon: 'WB-1000' },
    silver: { coupon: 'WB-600' },
    bronze: { coupon: 'WB-300' },
  },
  leaderboard: [
    {
      userId: 'season-user-1',
      username: 'Lilia',
      firstName: 'Лилия',
      lastName: null,
      finalRank: 1,
      finalElo: 2450,
      finalTier: 'legendary',
      rewardTier: 'gold',
      couponCode: 'WB-GOLD-2025',
      rewards: { coupon_code: 'WB-GOLD-2025', energy_total: 38200000 },
      claimed: false,
      claimedAt: null,
      energyTotal: 38_200_000,
    },
    {
      userId: 'season-user-2',
      username: 'Stormrider',
      firstName: 'Игорь',
      lastName: 'Буревестник',
      finalRank: 2,
      finalElo: 2310,
      finalTier: 'diamond',
      rewardTier: 'silver',
      couponCode: 'WB-SILVER-2025',
      rewards: { coupon_code: 'WB-SILVER-2025', energy_total: 31_500_000 },
      claimed: false,
      claimedAt: null,
      energyTotal: 31_500_000,
    },
    {
      userId: 'season-user-3',
      username: 'QuantumFox',
      firstName: 'Алекс',
      lastName: 'Фоксов',
      finalRank: 3,
      finalElo: 2190,
      finalTier: 'platinum',
      rewardTier: 'bronze',
      couponCode: null,
      rewards: { coupon_code: null, energy_total: 28_100_000 },
      claimed: true,
      claimedAt: '2025-11-01T09:30:00.000Z',
      energyTotal: 28_100_000,
    },
  ],
  generatedAt: MOCK_NOW_ISO,
};

const deepClone = <T>(input: T): T => JSON.parse(JSON.stringify(input));

export async function setupStageMocks(page: Page, options: StageMockOptions = {}) {
  const isAdmin = options.isAdmin ?? false;
  const sessionResponse = deepClone(mockSessionResponse);
  sessionResponse.user.is_admin = isAdmin;
  const profileResponse = deepClone(mockProfileResponse);
  profileResponse.user.is_admin = isAdmin;
  if (!(page as { __stageConsoleBound?: boolean }).__stageConsoleBound) {
    page.on('console', msg => console.log('[browser]', msg.text()));
    page.on('pageerror', error => console.error('[pageerror]', error));
    (page as { __stageConsoleBound?: boolean }).__stageConsoleBound = true;
  }

  const safeAreaOverride = options.safeAreaOverride
    ? JSON.parse(JSON.stringify(options.safeAreaOverride))
    : null;
  const viewportOverride = options.viewportOverride
    ? JSON.parse(JSON.stringify(options.viewportOverride))
    : null;

  const injectTelegram = options.injectTelegram !== false;

  await page.addInitScript(
    (
      nowMs: number,
      nowISO: string,
      scheme: 'light' | 'dark',
      initialSafeArea: SafeAreaOverrideInput | null,
      initialViewport: ViewportOverrideInput | null,
      platform: string,
      enableTelegram: boolean
    ) => {
    const mockDate = class extends Date {
      constructor(...args: ConstructorParameters<DateConstructor>) {
        if (args.length === 0) {
          super(nowMs);
          return;
        }
        super(...args);
      }

      static now() {
        return nowMs;
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Date = mockDate;

    if (enableTelegram) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Telegram = {
        WebApp: {
          ready: () => {},
          expand: () => {},
          close: () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).__manualCloseCalls = ((window as any).__manualCloseCalls ?? 0) + 1;
          },
          initData: '',
          initDataUnsafe: {},
          themeParams: {},
          onEvent: () => {},
          offEvent: () => {},
          disableVerticalSwipes: () => {},
          platform,
          colorScheme: scheme,
        },
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__manualCloseCalls = 0;

    const applyScheme = () => {
      const root = document.documentElement;
      if (!root) {
        return;
      }
      root.dataset.colorScheme = scheme;
      root.style.colorScheme = scheme;
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyScheme, { once: true });
    } else {
      applyScheme();
    }

    const originalSetInterval = window.setInterval.bind(window);
    const originalClearInterval = window.clearInterval.bind(window);
    const blockedIntervals: number[] = [];

    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = originalSetInterval(() => {}, Number.isFinite(timeout) ? Math.max(timeout ?? 0, 1e6) : 1e6);
      blockedIntervals.push(id);
      if (typeof handler === 'function') {
        try {
          handler(...(args as never));
        } catch (error) {
          console.error('[mock] interval handler error', error);
        }
      }
      return id;
    }) as typeof window.setInterval;

    window.clearInterval = (intervalId: number) => {
      originalClearInterval(intervalId);
    };

    window.addEventListener('beforeunload', () => {
      blockedIntervals.forEach(id => originalClearInterval(id));
    });

    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query.includes('prefers-reduced-motion')) {
        return {
          matches: true,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
          media: query,
          onchange: null,
        } as MediaQueryList;
      }
      return originalMatchMedia(query);
    };

    if (initialSafeArea) {
      window.__safeAreaOverride = initialSafeArea;
    }

    if (initialViewport) {
      window.__viewportMetricsOverride = initialViewport;
    }

    window.localStorage?.setItem('access_token', 'qa-access-token');
    window.localStorage?.setItem('refresh_token', 'qa-refresh-token');
    window.localStorage?.setItem('refresh_expires_at_ms', String(nowMs + 12 * 60 * 60 * 1000));
    window.localStorage?.setItem('last_mock_now_iso', nowISO);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__telemetryEvents = [];
  },
  MOCK_NOW_MS,
  MOCK_NOW_ISO,
  options.colorScheme ?? 'dark',
  safeAreaOverride,
  viewportOverride,
  options.platform ?? 'test',
  injectTelegram);

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
    {
      rank: 2,
      user_id: 'user-1',
      telegram_id: 1,
      username: 'test-user',
      first_name: 'Test',
      last_name: 'User',
      level: 10,
      total_energy_produced: 25_000,
    },
  ];

  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    let pathname: string | null = null;

    try {
      pathname = new URL(url).pathname;
    } catch {
      console.warn('[mock] passthrough', method, url);
      await route.continue();
      return;
    }

    if (!pathname) {
      console.warn('[mock] empty pathname', method, url);
      await route.continue();
      return;
    }

    console.log('[mock]', method, pathname);

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

    if (pathname.endsWith('/auth/tma') && method === 'POST') {
      await fulfillJson(200, {
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        refresh_expires_in: 86400,
        replay_status: 'fresh',
      });
      return;
    }

    if (pathname.endsWith('/auth/refresh') && method === 'POST') {
      await fulfillJson(200, {
        access_token: 'mock-access',
        expires_in: 3600,
      });
      return;
    }

    if (pathname.endsWith('/session') && method === 'POST') {
      await fulfillJson(200, sessionResponse);
      return;
    }

    if (pathname.startsWith('/api/v1/profile') && method === 'GET') {
      await fulfillJson(200, profileResponse);
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

    if (pathname.endsWith('/admin/seasons/snapshot') && method === 'GET') {
      const snapshot = options.seasonSnapshot ?? defaultSeasonSnapshot;
      await fulfillJson(200, snapshot);
      return;
    }

    const seasonRewardMatch = pathname.match(/\/admin\/seasons\/([^/]+)\/reward$/);
    if (seasonRewardMatch && method === 'POST') {
      const bodyText = request.postData() ?? '{}';
      console.log('[mock] season reward payload', {
        seasonId: seasonRewardMatch[1],
        payload: bodyText,
      });
      await fulfillJson(202, {
        status: 'accepted',
        rewardId: `mock-reward-${Date.now()}`,
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
              id: 'bonus-pack',
              title: 'Bonus Pack',
              description: 'Includes extra bonus Stars',
              stars: 600,
              bonus_stars: 120,
              price_rub: 299,
              icon_url: null,
              featured: true,
            },
            {
              id: 'mega-pack',
              title: 'Mega Pack',
              description: 'Best value stack with extra bonus',
              stars: 5000,
              bonus_stars: 1200,
              price_rub: 1990,
              icon_url: null,
              featured: false,
            },
            {
              id: 'starter-pack',
              title: 'Starter Stars',
              description: 'Базовый набор без бонусов',
              stars: 450,
              bonus_stars: 0,
              price_rub: 199,
              icon_url: null,
              featured: false,
            },
          ],
        });
      }
      return;
    }

    if (pathname.endsWith('/purchase/invoice') && method === 'POST') {
      const bodyText = request.postData() ?? '{}';
      try {
        const payload = JSON.parse(bodyText);
        console.log('[mock] purchase invoice payload', payload);
      } catch (error) {
        console.warn('[mock] failed to parse invoice payload', { bodyText, error });
      }
      await fulfillJson(200, {
        success: true,
        invoice: {
          purchase_id: `mock-purchase-${Date.now()}`,
          status: 'pending',
          pay_url: 'https://t.me/energyplanetbot',
        },
      });
      return;
    }

    if (pathname.endsWith('/purchase') && method === 'POST') {
      const bodyText = request.postData() ?? '{}';
      try {
        const payload = JSON.parse(bodyText);
        console.log('[mock] purchase complete payload', payload);
      } catch (error) {
        console.warn('[mock] failed to parse purchase payload', { bodyText, error });
      }
      await fulfillJson(200, {
        success: true,
        purchase: {
          purchase_id: `mock-purchase-${Date.now()}`,
          status: 'completed',
        },
      });
      return;
    }

    if (pathname.endsWith('/cosmetics') && method === 'GET') {
      await fulfillJson(200, {
        cosmetics: [
          {
            id: 'cosmic-flare',
            title: 'Cosmic Flare',
            type: 'background',
            rarity: 'epic',
            status: 'purchase_required',
            price_stars: 800,
            icon_url: null,
          },
        ],
      });
      return;
    }

    if (pathname.endsWith('/boost') && method === 'GET') {
      await fulfillJson(200, {
        boosts: [
          {
            id: 'turbo-charge',
            title: 'Турбо заряд',
            description: 'Увеличивает энергию в 2 раза на 1 час',
            duration_minutes: 60,
            multiplier: 2,
            cooldown_minutes: 180,
            available: true,
          },
        ],
      });
      return;
    }

    if (pathname.endsWith('/buildings') && method === 'GET') {
      await fulfillJson(200, {
        buildings: [
          {
            id: 'solar-array',
            name: 'Солнечная ферма',
            level: 12,
            energy_per_sec: 480,
            upgrade_cost: 12_000,
            next_upgrade_energy: 620,
          },
        ],
      });
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
            updated_at: MOCK_NOW_ISO,
          },
          last_updated: MOCK_NOW_ISO,
        },
      });
      return;
    }

    if (pathname.endsWith('/referrals/revenue') && method === 'GET') {
      await fulfillJson(200, {
        revenue: {
          revenue_share: { percentage: 0.025 },
          totals: { all_time: 320, month: 80, today: 12 },
          recent: [
            {
              id: 'event-1',
              purchase_amount: 199,
              share_amount: 40,
              purchase_type: 'starter-pack',
              granted_at: MOCK_NOW_ISO,
              referred: { user_id: 'friend-1', username: 'ally_cat', first_name: 'Ally' },
            },
          ],
          friends: [
            {
              referred: { user_id: 'friend-1', username: 'ally_cat', first_name: 'Ally' },
              total_share: 200,
              total_purchase: 800,
              last_share: 40,
              last_purchase: 199,
              last_purchase_at: MOCK_NOW_ISO,
            },
          ],
          updated_at: MOCK_NOW_ISO,
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
        potential_multiplier_gain: 0,
      });
      return;
    }

    if (pathname.endsWith('/quests') && method === 'GET') {
      await fulfillJson(200, { quests: [] });
      return;
    }

    if (pathname.includes('/telemetry/client')) {
      const body = request.postData();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          await page.evaluate(event => {
            const globalWindow = window as typeof window & {
              __telemetryEvents?: unknown[];
            };
            globalWindow.__telemetryEvents = globalWindow.__telemetryEvents ?? [];
            globalWindow.__telemetryEvents.push(event);
          }, parsed);
        } catch (error) {
          console.warn('[mock] failed to record telemetry payload', error);
        }
      }
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
