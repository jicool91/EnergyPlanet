import { TickService } from '../TickService';
import { AppError } from '../../middleware/errorHandler';

jest.mock('../playerContext', () => ({
  loadPlayerContext: jest.fn(),
}));

jest.mock('../passiveIncome', () => ({
  buildBuildingDetails: jest.fn((inventory) => inventory),
  computePassiveIncome: jest.fn(() => ({
    effectiveIncome: 2,
    effectiveMultiplier: 1,
    boostMultiplier: 1,
    prestigeMultiplier: 1,
  })),
}));

jest.mock('../../repositories/ProgressRepository', () => {
  const actual = jest.requireActual('../../repositories/ProgressRepository');
  return {
    ...actual,
    updateProgress: jest.fn(async () => ({
      userId: 'user-1',
      level: 2,
      xp: 200,
      energy: 400,
      totalEnergyProduced: 800,
      tapLevel: 1,
      prestigeLevel: 0,
      prestigeMultiplier: 1,
      prestigeEnergySnapshot: 0,
      prestigeLastReset: null,
      lastLogin: null,
      lastLogout: null,
      createdAt: new Date('2025-10-20T00:00:00Z'),
      updatedAt: new Date('2025-10-27T00:00:00Z'),
    })),
  };
});

jest.mock('../../repositories/PlayerSessionRepository', () => ({
  ensurePlayerSession: jest.fn(),
  updatePlayerSession: jest.fn(),
}));

jest.mock('../../repositories/EventRepository', () => ({
  logEvent: jest.fn(),
}));

jest.mock('../../db/connection', () => ({
  transaction: jest.fn(async (cb: any) => cb({})),
}));

const { loadPlayerContext } = jest.requireMock('../playerContext');
const { ensurePlayerSession, updatePlayerSession } = jest.requireMock(
  '../../repositories/PlayerSessionRepository'
);
const { updateProgress } = jest.requireMock('../../repositories/ProgressRepository');
const { logEvent } = jest.requireMock('../../repositories/EventRepository');

describe('TickService', () => {
  const service = new TickService();

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(new Date('2025-10-27T00:00:00Z'));
    loadPlayerContext.mockResolvedValue({
      progress: {
        userId: 'user-1',
        level: 2,
        xp: 100,
        energy: 200,
        totalEnergyProduced: 600,
        tapLevel: 1,
        prestigeLevel: 0,
        prestigeMultiplier: 1,
        prestigeEnergySnapshot: 0,
        prestigeLastReset: null,
        lastLogin: null,
        lastLogout: new Date('2025-10-26T22:00:00Z'),
        createdAt: new Date('2025-10-01T00:00:00Z'),
        updatedAt: new Date('2025-10-26T22:00:00Z'),
      },
      inventory: [],
      boosts: [],
      user: { id: 'user-1' },
      profile: {},
      cosmetics: [],
    });
    ensurePlayerSession.mockResolvedValue({
      id: 'ps-1',
      userId: 'user-1',
      authSessionId: 'session-1',
      lastTickAt: new Date('2025-10-26T23:30:00Z'),
      pendingPassiveSeconds: 90,
      createdAt: new Date('2025-10-01T00:00:00Z'),
      updatedAt: new Date('2025-10-26T23:30:00Z'),
    });
  });

  it('accrues passive income based on server elapsed time and pending seconds', async () => {
    const result = await service.applyTick('user-1', 0);

    expect(result.duration_sec).toBeGreaterThan(0);
    expect(result.energy_gained).toBeGreaterThan(0);
    expect(updateProgress).toHaveBeenCalled();
    expect(updatePlayerSession).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        lastTickAt: new Date('2025-10-27T00:00:00Z'),
      }),
      expect.anything()
    );
    expect(logEvent).toHaveBeenCalledWith(
      'user-1',
      'tick',
      expect.objectContaining({
        duration_sec: result.duration_sec,
        energy_gained: result.energy_gained,
      }),
      expect.anything()
    );
  });

  it('returns zero gain when no time elapsed and no pending seconds', async () => {
    ensurePlayerSession.mockResolvedValueOnce({
      id: 'ps-1',
      userId: 'user-1',
      authSessionId: 'session-1',
      lastTickAt: new Date('2025-10-27T00:00:00Z'),
      pendingPassiveSeconds: 0,
      createdAt: new Date('2025-10-01T00:00:00Z'),
      updatedAt: new Date('2025-10-26T23:30:00Z'),
    });

    const result = await service.applyTick('user-1', 0);

    expect(result.energy_gained).toBe(0);
    expect(result.duration_sec).toBe(0);
    expect(updateProgress).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('throws for NaN delta', async () => {
    await expect(service.applyTick('user-1', Number.NaN)).rejects.toBeInstanceOf(AppError);
  });
});
