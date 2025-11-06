import type { Response, NextFunction } from 'express';
import { AppError } from '../../../middleware/errorHandler';

const authenticateWithTelegramMock = jest.fn();

jest.mock('../../../services/AuthService', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      authenticateWithTelegram: authenticateWithTelegramMock,
      refreshAccessToken: jest.fn(),
    })),
  };
});

// eslint-disable-next-line import/first
import { AuthController } from '../AuthController';

describe('AuthController.authenticateWithTelegramHeader', () => {
  beforeEach(() => {
    authenticateWithTelegramMock.mockReset();
    delete process.env.TELEGRAM_ALLOWED_ORIGINS;
  });

  it('rejects requests from запрещённого origin', async () => {
    process.env.TELEGRAM_ALLOWED_ORIGINS = 'https://allowed.test';
    const controller = new AuthController();
    const req = {
      headers: {
        authorization: 'tma initdata',
        origin: 'https://evil.test',
      },
      ip: '127.0.0.1',
    } as unknown as Parameters<typeof controller.authenticateWithTelegramHeader>[0];
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn<ReturnType<NextFunction>, Parameters<NextFunction>>();

    await controller.authenticateWithTelegramHeader(
      req,
      res as Response,
      next as unknown as NextFunction
    );

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0] as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('origin_not_allowed');
    expect(authenticateWithTelegramMock).not.toHaveBeenCalled();
  });

  it('пропускает запросы с origin из белого списка', async () => {
    process.env.TELEGRAM_ALLOWED_ORIGINS = 'https://allowed.test';
    const controller = new AuthController();
    const req = {
      headers: {
        authorization: 'tma initdata',
        origin: 'https://allowed.test',
      },
      ip: '127.0.0.1',
    } as unknown as Parameters<typeof controller.authenticateWithTelegramHeader>[0];
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn<ReturnType<NextFunction>, Parameters<NextFunction>>();

    authenticateWithTelegramMock.mockResolvedValueOnce({ ok: true });

    await controller.authenticateWithTelegramHeader(
      req,
      res as Response,
      next as unknown as NextFunction
    );

    expect(authenticateWithTelegramMock).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
  });
});
