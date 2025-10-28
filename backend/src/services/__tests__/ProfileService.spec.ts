import { cacheKeys } from '../../cache/cacheKeys';
import { ProfileService } from '../ProfileService';

const getCacheMock = jest.fn();
const setCacheMock = jest.fn();
const transactionMock = jest.fn<Promise<unknown>, [(client: unknown) => Promise<unknown>]>(
  async handler => handler({})
);
const loadPlayerContextMock = jest.fn();

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    server: { env: 'test' },
    cache: {
      enabled: true,
      ttl: {
        profile: 15,
        leaderboard: 30,
      },
    },
  },
}));

jest.mock('../../cache/redis', () => ({
  getCache: jest.fn((key: string) => getCacheMock(key)),
  setCache: jest.fn((key: string, value: unknown, ttl: number) => setCacheMock(key, value, ttl)),
}));

jest.mock('../../db/connection', () => ({
  transaction: jest.fn((handler: (client: unknown) => Promise<unknown>) => transactionMock(handler)),
}));

jest.mock('../playerContext', () => ({
  loadPlayerContext: jest.fn((...args) => loadPlayerContextMock(...args)),
}));

jest.mock('../passiveIncome', () => ({
  buildBuildingDetails: jest.fn(() => [{ buildingId: 'solar_panel', count: 1, level: 0, incomePerSec: 10 }]),
  computePassiveIncome: jest.fn(() => ({
    baseIncome: 42,
    boostMultiplier: 1.5,
    prestigeMultiplier: 1.3,
    effectiveMultiplier: 1.95,
    effectiveIncome: 81.9,
  })),
}));

jest.mock('../../utils/level', () => ({
  calculateLevelProgress: jest.fn(() => ({
    xpIntoLevel: 100,
    xpToNextLevel: 200,
    level: 3,
  })),
}));

jest.mock('../../utils/tap', () => ({
  tapEnergyForLevel: jest.fn(() => 5),
}));

describe('ProfileService caching', () => {
  const service = new ProfileService();

  const baseContext = {
    user: {
      id: 'user-1',
      telegramId: 12345,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
    },
    profile: {
      equippedAvatarFrame: 'frame-1',
      equippedPlanetSkin: 'skin-1',
      equippedTapEffect: 'effect-1',
      equippedBackground: 'bg-1',
      bio: 'hello',
      isPublic: true,
      updatedAt: new Date('2025-10-22T10:00:00Z'),
    },
    progress: {
      level: 3,
      xp: 1200,
      totalEnergyProduced: 5000,
      energy: 800,
      tapLevel: 2,
      prestigeLevel: 2,
      prestigeMultiplier: 1.3,
      prestigeEnergySnapshot: 3500,
      prestigeLastReset: new Date('2025-10-20T08:00:00Z'),
      lastLogin: new Date('2025-10-22T09:00:00Z'),
      lastLogout: null,
    },
    inventory: [],
    boosts: [
      {
        id: 'boost-1',
        userId: 'user-1',
        boostType: 'daily_boost',
        multiplier: 2,
        expiresAt: new Date('2025-10-22T12:00:00Z'),
        createdAt: new Date('2025-10-22T08:00:00Z'),
      },
    ],
    cosmetics: [],
  };

  beforeEach(() => {
    getCacheMock.mockReset();
    setCacheMock.mockReset();
    transactionMock.mockReset();
    transactionMock.mockImplementation(async handler => handler({}));
    loadPlayerContextMock.mockReset();
    loadPlayerContextMock.mockImplementation(async () => baseContext);
  });

  it('returns cached profile when cache hit', async () => {
    const cachedProfile = { cached: true };
    getCacheMock.mockResolvedValueOnce(cachedProfile);

    const result = await service.getProfile('user-1');

    expect(result).toBe(cachedProfile);
    expect(transactionMock).not.toHaveBeenCalled();
    expect(setCacheMock).not.toHaveBeenCalled();
  });

  it('loads profile and caches when cache miss', async () => {
    getCacheMock.mockResolvedValueOnce(null);
    const result = await service.getProfile('user-1');

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(setCacheMock).toHaveBeenCalledWith(
      cacheKeys.profile('user-1'),
      expect.any(Object),
      15
    );
    expect(result.user.id).toBe('user-1');
  });
});
