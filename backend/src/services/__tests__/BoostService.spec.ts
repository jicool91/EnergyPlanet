import { BoostRecord } from '../../repositories/BoostRepository';

const getActiveBoostsMock = jest.fn();
const getLastBoostClaimMock = jest.fn();
const logEventMock = jest.fn();

jest.mock('../../repositories/BoostRepository', () => ({
  getActiveBoosts: jest.fn(async (...args: unknown[]) => getActiveBoostsMock(...args)),
  findActiveBoostByType: jest.fn(),
  createBoost: jest.fn(),
}));

jest.mock('../../repositories/EventRepository', () => ({
  getLastBoostClaim: jest.fn(async (...args: unknown[]) => getLastBoostClaimMock(...args)),
  logEvent: jest.fn(async (...args: unknown[]) => logEventMock(...args)),
}));

jest.mock('../ContentService', () => ({
  contentService: {
    getFeatureFlags: jest.fn(() => ({
      boosts: {
        ad_boost: {
          enabled: true,
          duration_sec: 600,
          multiplier: 1.8,
          cooldown_sec: 1800,
        },
        daily_boost: {
          enabled: true,
          duration_sec: 900,
          multiplier: 1.5,
          cooldown_sec: 86400,
        },
        premium_boosts: {
          enabled: true,
          cooldown_sec: 86400,
          items: [
            {
              id: 'premium_boost_1h',
              duration_sec: 3600,
              multiplier: 2.5,
              price_stars: 50,
            },
          ],
        },
      },
    })),
  },
}));

const { boostService } = require('../BoostService');

describe('BoostService.getBoostHub', () => {
  beforeEach(() => {
    getActiveBoostsMock.mockReset();
    getLastBoostClaimMock.mockReset();
  });

  it('returns boost status with cooldowns and actives', async () => {
    const now = new Date('2025-10-22T10:00:00Z');
    jest.useFakeTimers().setSystemTime(now);

    const activeBoost: BoostRecord = {
      id: 'active-1',
      userId: 'user-1',
      boostType: 'daily_boost',
      multiplier: 3,
      createdAt: new Date('2025-10-22T08:00:00Z'),
      expiresAt: new Date('2025-10-22T12:00:00Z'),
    };

    getActiveBoostsMock.mockResolvedValueOnce([activeBoost]);

    getLastBoostClaimMock.mockImplementation(async (_userId: string, type: string) => {
      if (type === 'daily_boost') {
        return new Date('2025-10-21T10:00:00Z');
      }
      if (type === 'ad_boost') {
        return new Date('2025-10-22T09:40:00Z');
      }
      return null;
    });

    const hub = await boostService.getBoostHub('user-1');

    expect(hub.server_time).toEqual(now.toISOString());
    expect(hub.boosts).toHaveLength(3);

    const daily = hub.boosts.find((it: any) => it.boost_type === 'daily_boost');
    expect(daily.active).toMatchObject({ id: 'active-1' });
    expect(daily.available_at).toBe('2025-10-22T10:00:00.000Z');
    expect(daily.cooldown_remaining_seconds).toBe(0);

    const ad = hub.boosts.find((it: any) => it.boost_type === 'ad_boost');
    expect(ad.cooldown_remaining_seconds).toBeGreaterThan(0);
    expect(new Date(ad.available_at).getTime()).toBeGreaterThan(now.getTime());

    const premium = hub.boosts.find((it: any) => it.boost_type === 'premium_boost');
    expect(premium.requires_premium).toBe(true);

    jest.useRealTimers();
  });
});
