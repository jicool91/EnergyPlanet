import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../AuthController';
import { AppError } from '../../../middleware/errorHandler';

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as unknown as Response;
};

type AuthServiceMock = {
  authenticateWithTelegram: jest.Mock;
};

describe('AuthController.authenticateWithTelegramHeader', () => {
  let controller: AuthController;
  let authServiceMock: AuthServiceMock;

  beforeEach(() => {
    controller = new AuthController();
    authServiceMock = {
      authenticateWithTelegram: jest.fn().mockResolvedValue({ ok: true }),
    };
    Reflect.set(controller as unknown, 'authService', authServiceMock);
  });

  it('authenticates using tma authorization header', async () => {
    const req = {
      headers: {
        authorization: 'tma foo=bar&hash=baz',
        origin: 'https://t.me',
      },
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    await controller.authenticateWithTelegramHeader(req, res, next);

    expect(authServiceMock.authenticateWithTelegram).toHaveBeenCalledWith('foo=bar&hash=baz', {
      enforceReplayProtection: true,
    });
    expect(res.status as jest.Mock).toHaveBeenCalledWith(200);
    expect((res.json as jest.Mock).mock.calls[0][0]).toEqual({ ok: true });
    expect(next).not.toHaveBeenCalled();
  });

  it('supports telegraminit scheme for backwards compatibility', async () => {
    const req = {
      headers: {
        authorization: 'TelegramInit foo=bar',
        origin: 'https://t.me',
      },
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    await controller.authenticateWithTelegramHeader(req, res, next);

    expect(authServiceMock.authenticateWithTelegram).toHaveBeenCalledWith('foo=bar', {
      enforceReplayProtection: true,
    });
    expect(res.status as jest.Mock).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('delegates error via next when authorization header missing', async () => {
    const req = {
      headers: {},
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    await controller.authenticateWithTelegramHeader(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0]?.[0] as unknown as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('authorization_header_missing');
  });

  it('delegates error via next when scheme is invalid', async () => {
    const req = {
      headers: {
        authorization: 'Bearer foo',
        origin: 'https://t.me',
      },
      ip: '127.0.0.1',
    } as unknown as Request;
    const res = createResponse();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;

    await controller.authenticateWithTelegramHeader(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0]?.[0] as unknown as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('authorization_scheme_invalid');
  });
});
