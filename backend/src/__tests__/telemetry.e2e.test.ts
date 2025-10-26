import request from 'supertest';
import app from '../index';

const logEventMock = jest.fn();

jest.mock('../middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'telemetry-user',
      telegramId: 987654,
      username: 'telemetry_test',
      isAdmin: false,
    };
    req.authContext = { strategy: 'bearer' };
    next();
  },
  authenticateTick: (req: any, _res: any, next: any) => {
    req.user = {
      id: 'telemetry-user',
      telegramId: 987654,
      username: 'telemetry_test',
      isAdmin: false,
    };
    req.authContext = { strategy: 'bearer' };
    next();
  },
  requireAdmin: (_req: any, _res: any, next: any) => next(),
}));

jest.mock('../repositories/EventRepository', () => ({
  logEvent: jest.fn(async (...args: unknown[]) => logEventMock(...args)),
}));

describe('Telemetry routes', () => {
  beforeEach(() => {
    logEventMock.mockReset();
  });

  it('logs client event and returns 202', async () => {
    const payload = {
      event: 'offline_income_error',
      severity: 'warn',
      context: { source: 'refreshSession', status: 500 },
    };

    const response = await request(app)
      .post('/api/v1/telemetry/client')
      .send(payload);

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ success: true });
    expect(logEventMock).toHaveBeenCalledWith(
      'telemetry-user',
      'offline_income_error',
      expect.objectContaining({ severity: 'warn', status: 500, platform: 'client' })
    );
  });

  it('rejects invalid client events', async () => {
    const response = await request(app)
      .post('/api/v1/telemetry/client')
      .send({ context: {} });

    expect(response.status).toBe(400);
  });
});
