import { hashToken } from '../../utils/token';

const findByRefreshTokenHashMock = jest.fn();
const rotateSessionTokenMock = jest.fn();
const deleteSessionByHashMock = jest.fn();
const findUserByIdMock = jest.fn();
const logEventMock = jest.fn();

jest.mock('../../config', () => ({
  config: {
    jwt: { secret: 'test-secret', accessExpiry: '15m', refreshExpiry: '7d' },
    telegram: { botTokens: ['123456:test-token'] },
    testing: { bypassAuth: false },
  },
}));

jest.mock('../../repositories/SessionRepository', () => ({
  findByRefreshTokenHash: jest.fn(async (...args) => findByRefreshTokenHashMock(...args)),
  rotateSessionToken: jest.fn(async (...args) => rotateSessionTokenMock(...args)),
  deleteSessionByHash: jest.fn(async (...args) => deleteSessionByHashMock(...args)),
  createSession: jest.fn(),
}));

jest.mock('../../repositories/UserRepository', () => ({
  findById: jest.fn(async (...args) => findUserByIdMock(...args)),
}));

jest.mock('../../repositories/EventRepository', () => ({
  logEvent: jest.fn(async (...args) => logEventMock(...args)),
}));

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const { AuthService } = require('../AuthService');
const { logger } = require('../../utils/logger');

describe('AuthService.refreshAccessToken', () => {
  beforeEach(() => {
    findByRefreshTokenHashMock.mockReset();
    rotateSessionTokenMock.mockReset();
    deleteSessionByHashMock.mockReset();
    findUserByIdMock.mockReset();
    logEventMock.mockReset();
    logger.info.mockClear();
    logger.warn.mockClear();
    logger.error.mockClear();
    logger.debug.mockClear();
  });

  it('rotates refresh token and returns new credentials', async () => {
    const authService = new AuthService();
    const user = {
      id: 'user-1',
      telegramId: 1000,
      username: 'tester',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
    };

    const initialTokens = (authService as any).generateTokens(user);
    const sessionRecord = {
      id: 'session-1',
      userId: user.id,
      refreshTokenHash: hashToken(initialTokens.refreshToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      createdAt: new Date(),
    };

    findByRefreshTokenHashMock.mockResolvedValueOnce(sessionRecord);
    findUserByIdMock.mockResolvedValueOnce(user);

    rotateSessionTokenMock.mockImplementationOnce(async (_id: string, newHash: string, expiresAt: Date) => ({
      ...sessionRecord,
      refreshTokenHash: newHash,
      expiresAt,
    }));

    const result = await authService.refreshAccessToken(initialTokens.refreshToken);

    expect(result.refresh_token).not.toBe(initialTokens.refreshToken);
    expect(typeof result.access_token).toBe('string');
    expect(result.access_token.length).toBeGreaterThan(10);
    expect(rotateSessionTokenMock).toHaveBeenCalledWith(
      sessionRecord.id,
      hashToken(result.refresh_token),
      expect.any(Date)
    );
    expect(logEventMock).toHaveBeenCalledWith(user.id, 'token_refresh', expect.objectContaining({ session_id: sessionRecord.id, rotated: true }));
  });

  it('deletes session when refresh token expired', async () => {
    const authService = new AuthService();
    const expiredRefresh = (authService as any).generateTokens({
      id: 'user-expired',
      telegramId: 999,
      username: 'expired',
      firstName: 'Ex',
      lastName: 'Pired',
      isAdmin: false,
    }).refreshToken;

    const expiredSession = {
      id: 'session-expired',
      userId: 'user-expired',
      refreshTokenHash: hashToken(expiredRefresh),
      expiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(Date.now() - 2000),
    };

    findByRefreshTokenHashMock.mockResolvedValueOnce(expiredSession);

    await expect(authService.refreshAccessToken(expiredRefresh)).rejects.toMatchObject({
      message: 'refresh_token_expired',
    });

    expect(deleteSessionByHashMock).toHaveBeenCalledWith(expiredSession.refreshTokenHash);
    expect(rotateSessionTokenMock).not.toHaveBeenCalled();
  });
});
