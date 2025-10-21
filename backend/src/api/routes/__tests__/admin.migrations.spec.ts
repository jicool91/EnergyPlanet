import request from 'supertest';

const mockGetMigrationStatus = jest.fn();

jest.mock('../../../services/AdminService', () => {
  return {
    AdminService: jest.fn().mockImplementation(() => ({
      getMigrationStatus: mockGetMigrationStatus,
      getFullHealthStatus: jest.fn(),
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
