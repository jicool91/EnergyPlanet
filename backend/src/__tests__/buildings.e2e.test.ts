import request from 'supertest';
import app from '../index';

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      telegramId: 123,
      username: 'test_user',
      isAdmin: false,
    };
    req.authContext = { strategy: 'bearer' };
    next();
  },
  authenticateTick: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      telegramId: 123,
      username: 'test_user',
      isAdmin: false,
    };
    req.authContext = { strategy: 'bearer' };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

const mockBuildings = [
  {
    id: 'solar_panel',
    name: 'Solar Panel',
    description: 'Solar energy',
    tier: 1,
    base_income: 8,
    base_cost: 200,
    cost_multiplier: 1.08,
    upgrade_cost_multiplier: 1.2,
    upgrade_income_bonus: 0.18,
    unlock_level: 1,
    max_count: 999,
    category: 'renewable',
    rarity: 'common',
  },
];

jest.mock('../services/ContentService', () => ({
  contentService: {
    getBuildings: jest.fn(() => mockBuildings),
  },
}));

describe('Buildings catalog', () => {
  it('returns building definitions with payback', async () => {
    const response = await request(app).get('/api/v1/buildings');

    expect(response.status).toBe(200);
    expect(response.body.buildings).toHaveLength(1);
    expect(response.body.buildings[0]).toMatchObject({
      id: 'solar_panel',
      base_income: 8,
      base_cost: 200,
      payback_seconds: 25,
      roi_rank: 1,
    });
  });
});
