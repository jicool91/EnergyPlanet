import { test, expect, Page } from '@playwright/test';

const PERF_DURATION_MS = Number(process.env.PERF_DURATION_MS ?? '300000');
const TAP_DELAY_MS = Number(process.env.PERF_TAP_DELAY_MS ?? '25');

const mockSessionResponse = {
  user: {
    id: 'user-1',
    username: 'test-user',
  },
  progress: {
    level: 12,
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

const mockBuildings = [
  {
    id: 'solar-array',
    name: 'Solar Array',
    description: 'Generates passive energy from sunlight.',
    tier: 1,
    base_income: 25,
    base_cost: 100,
    cost_multiplier: 1.15,
    upgrade_cost_multiplier: 1.5,
    upgrade_income_bonus: 15,
    unlock_level: 1,
    max_count: null,
    category: 'energy',
    rarity: 'common',
    payback_seconds: 120,
    roi_rank: 1,
  },
  {
    id: 'fusion-reactor',
    name: 'Fusion Reactor',
    description: 'High output, high cost passive source.',
    tier: 2,
    base_income: 250,
    base_cost: 2_000,
    cost_multiplier: 1.2,
    upgrade_cost_multiplier: 1.6,
    upgrade_income_bonus: 120,
    unlock_level: 10,
    max_count: null,
    category: 'energy',
    rarity: 'rare',
    payback_seconds: 180,
    roi_rank: 2,
  },
];

async function setupApiMocks(page: Page) {
  let serverEnergy = mockSessionResponse.progress.energy;
  let serverXp = mockSessionResponse.progress.xp;

  await page.route('**/api/v1/**', async route => {
    const { url, method } = route.request();

    if (url.endsWith('/auth/telegram') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: 'test-token', refresh_token: 'test-refresh' }),
      });
      return;
    }

    if (url.endsWith('/session') && method === 'POST') {
      serverEnergy = mockSessionResponse.progress.energy;
      serverXp = mockSessionResponse.progress.xp;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSessionResponse),
      });
      return;
    }

    if (url.endsWith('/buildings') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ buildings: mockBuildings }),
      });
      return;
    }

    if (url.endsWith('/boosts') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ boosts: [] }),
      });
      return;
    }

    if (url.endsWith('/leaderboard') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          leaderboard: [],
          total_players: 0,
          user_rank: null,
          user_entry: null,
        }),
      });
      return;
    }

    if (url.includes('/profile/') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
            level: 12,
            xp: serverXp,
            xp_into_level: 300,
            xp_to_next_level: 700,
            total_energy_produced: 25_000,
            energy: serverEnergy,
            tap_level: 3,
            tap_income: 45,
            passive_income_per_sec: 120,
            passive_income_multiplier: 1,
            last_login: new Date().toISOString(),
            last_logout: null,
          },
          boosts: [],
          buildings: [],
        }),
      });
      return;
    }

    if (url.endsWith('/cosmetics') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cosmetics: [] }),
      });
      return;
    }

    if (url.endsWith('/purchase/packs') && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ packs: [] }),
      });
      return;
    }

    if (url.endsWith('/tap') && method === 'POST') {
      serverEnergy += 45;
      serverXp += 10;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          energy: serverEnergy,
          energy_gained: 45,
          xp_gained: 10,
          xp_into_level: 300,
          xp_to_next_level: 700,
          level: 12,
          level_up: false,
          boost_multiplier: 1,
        }),
      });
      return;
    }

    if (url.endsWith('/tick') && method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          energy: serverEnergy,
          level: 12,
          xp_gained: 0,
          xp_into_level: 300,
          xp_to_next_level: 700,
          passive_income_per_sec: mockSessionResponse.progress.passive_income_per_sec,
        }),
      });
      return;
    }

    if (method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({}),
    });
  });
}

function computeMaxExpectedRenders(durationMs: number) {
  // assume throttled renders every 120ms under load
  return Math.ceil(durationMs / 120);
}

test.describe('Performance – Tap Loop', () => {
  test('records FPS and render counts during tap loop', async ({ page }) => {
    await setupApiMocks(page);

    await page.goto('./');
    await page.waitForSelector('[data-test-id="tap-button"]', { timeout: 30_000 });

    const initialRenderCount = await page.evaluate(() => window.__renderMetrics?.app ?? 0);

    const tapButton = page.getByTestId('tap-button');
    const duration = PERF_DURATION_MS;

    const fpsPromise = page.evaluate(async (runDuration: number) => {
      return new Promise<number>(resolve => {
        let frames = 0;
        const start = performance.now();
        const step = (timestamp: number) => {
          frames += 1;
          if (timestamp - start >= runDuration) {
            resolve((frames * 1000) / (timestamp - start));
            return;
          }
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, duration);

    const tapPromise = (async () => {
      const end = Date.now() + duration;
      while (Date.now() < end) {
        await tapButton.click({ delay: TAP_DELAY_MS });
      }
    })();

    const fps = await fpsPromise;
    await tapPromise;
    await page.waitForTimeout(1_000);

    const finalRenderCount = await page.evaluate(() => window.__renderMetrics?.app ?? 0);
    const rendersDuringRun = finalRenderCount - initialRenderCount;

    test.info().annotations.push(
      { type: 'metric', description: `avg_fps=${fps.toFixed(2)}` },
      { type: 'metric', description: `renders=${rendersDuringRun}` }
    );

    expect(fps).toBeGreaterThan(40);

    const maxExpectedRenders = computeMaxExpectedRenders(duration);
    expect(rendersDuringRun).toBeLessThanOrEqual(maxExpectedRenders);
  });
});
