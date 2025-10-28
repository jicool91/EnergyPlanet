import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';

const mockGetMigrationStatus = jest.fn();
const mockGetDailyMetrics = jest.fn();

jest.mock('../../../middleware/auth', () => ({
  authenticate: (_req: Request, _res: Response, next: NextFunction) => next(),
  authenticateTick: (_req: Request, _res: Response, next: NextFunction) => next(),
  requireAdmin: (_req: Request, _res: Response, next: NextFunction) => next(),
}));

jest.mock('../../../services/AdminService', () => {
  return {
    AdminService: jest.fn().mockImplementation(() => ({
      getMigrationStatus: mockGetMigrationStatus,
      getFullHealthStatus: jest.fn(),
    })),
  };
});

jest.mock('../../../services/MonetizationAnalyticsService', () => {
  return {
    MonetizationAnalyticsService: jest.fn().mockImplementation(() => ({
      getDailyMetrics: mockGetDailyMetrics,
    })),
  };
});

process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://test:test@localhost:5432/energy_planet';
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

// eslint-disable-next-line import/first
import app from '../../../index';

describe('GET /api/v1/admin/migrations/status', () => {
  beforeEach(() => {
    mockGetMigrationStatus.mockReset();
  });

  it('returns migration status payload', async () => {
    const payload = {
      applied: 3,
      pending: 0,
      lastAppliedAt: '2025-10-20T10:00:00.000Z',
      migrations: [
        { version: '001', name: 'initial_schema', applied: true, appliedAt: '2025-10-19T09:00:00.000Z' },
        { version: '002', name: 'clans_schema', applied: true, appliedAt: '2025-10-19T09:30:00.000Z' },
        { version: '003', name: 'arena_schema', applied: true, appliedAt: '2025-10-20T10:00:00.000Z' },
      ],
    };

    mockGetMigrationStatus.mockResolvedValue(payload);

    const response = await request(app).get('/api/v1/admin/migrations/status');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
    expect(mockGetMigrationStatus).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/v1/admin/monetization/metrics', () => {
  beforeEach(() => {
    mockGetDailyMetrics.mockReset();
  });

  it('returns monetization metrics payload', async () => {
    const payload = {
      generatedAt: '2025-10-28T09:00:00.000Z',
      windowStart: '2025-10-15T00:00:00.000Z',
      windowEnd: '2025-10-28T09:00:00.000Z',
      days: 14,
      daily: [
        {
          date: '2025-10-15',
          shopTabImpressions: 120,
          shopViews: 45,
          shopVisitRate: 0.375,
          questClaimStarts: 80,
          questClaimSuccess: 72,
          questClaimSuccessRate: 0.9,
          dailyBoostUpsellViews: 30,
          dailyBoostUpsellClicks: 6,
          dailyBoostUpsellCtr: 0.2,
        },
      ],
    };

    mockGetDailyMetrics.mockResolvedValue(payload);

    const response = await request(app).get('/api/v1/admin/monetization/metrics?days=7');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(payload);
    expect(mockGetDailyMetrics).toHaveBeenCalledWith(7);
  });
});
