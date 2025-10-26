import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler';
import { validateTelegramInitData } from '../telegramAuth';

const TEST_TOKEN = '123456:test_token';
const DEFAULT_USER = {
  id: 987654321,
  first_name: 'Test',
  username: 'test_user',
};

const buildDataCheckString = (entries: [string, string][]) =>
  entries
    .slice()
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

function signInitData(
  params: URLSearchParams,
  botToken: string,
  variant: 'default' | 'no_signature' = 'default'
) {
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const entries = Array.from(params.entries());
  const filtered = entries.filter(([key]) => key !== 'hash');
  const dataCheckString =
    variant === 'default'
      ? buildDataCheckString(filtered)
      : buildDataCheckString(filtered.filter(([key]) => key !== 'signature'));
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);
}

function createInitData(options?: {
  botToken?: string;
  authDate?: number;
  userOverride?: Partial<typeof DEFAULT_USER>;
  includeSignature?: boolean;
}) {
  const botToken = options?.botToken ?? TEST_TOKEN;
  const authDate = options?.authDate ?? Math.floor(Date.now() / 1000);
  const params = new URLSearchParams();
  const user = {
    ...DEFAULT_USER,
    ...options?.userOverride,
  };

  params.set('user', JSON.stringify(user));
  params.set('auth_date', String(authDate));

  if (options?.includeSignature !== false) {
    params.set('signature', 'optional_signature_value');
  }

  signInitData(params, botToken, options?.includeSignature === false ? 'no_signature' : 'default');
  return params;
}

describe('validateTelegramInitData', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = TEST_TOKEN;
  });

  it('returns parsed user and matched bot token for valid initData', () => {
    const initData = createInitData().toString();

    const result = validateTelegramInitData(initData, [TEST_TOKEN]);

    expect(result.telegramUser.id).toBe(DEFAULT_USER.id);
    expect(result.telegramUser.username).toBe(DEFAULT_USER.username);
    expect(result.matchedBotToken).toBe(TEST_TOKEN);
  });

  it('accepts payloads without signature parameter', () => {
    const initData = createInitData({ includeSignature: false }).toString();

    const result = validateTelegramInitData(initData, [TEST_TOKEN]);

    expect(result.telegramUser.id).toBe(DEFAULT_USER.id);
    expect(result.matchedBotToken).toBe(TEST_TOKEN);
  });

  it('throws when hash does not match payload', () => {
    const params = createInitData();
    const tamperedUser = {
      ...DEFAULT_USER,
      username: 'evil_user',
    };
    params.set('user', JSON.stringify(tamperedUser));
    const initData = params.toString();

    expect(() => validateTelegramInitData(initData, [TEST_TOKEN])).toThrowError(AppError);
    try {
      validateTelegramInitData(initData, [TEST_TOKEN]);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toBe('invalid_telegram_hash');
    }
  });

  it('throws when hash parameter is missing', () => {
    const params = createInitData();
    params.delete('hash');
    const initData = params.toString();

    expect(() => validateTelegramInitData(initData, [TEST_TOKEN])).toThrowError(AppError);
    try {
      validateTelegramInitData(initData, [TEST_TOKEN]);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toBe('missing_telegram_hash');
    }
  });

  it('throws when auth_date is older than allowed max age', () => {
    const oldAuthDate = Math.floor(Date.now() / 1000) - 600; // older than default 300s
    const initData = createInitData({ authDate: oldAuthDate }).toString();

    expect(() => validateTelegramInitData(initData, [TEST_TOKEN])).toThrowError(AppError);
    try {
      validateTelegramInitData(initData, [TEST_TOKEN]);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toBe('auth_data_expired');
    }
  });

  it('throws when auth_date is invalid', () => {
    const params = createInitData();
    params.set('auth_date', 'not-a-number');
    signInitData(params, TEST_TOKEN);
    const initData = params.toString();

    expect(() => validateTelegramInitData(initData, [TEST_TOKEN])).toThrowError(AppError);
    try {
      validateTelegramInitData(initData, [TEST_TOKEN]);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toBe('auth_data_invalid');
    }
  });

  it('throws when user payload is missing', () => {
    const params = createInitData();
    params.delete('user');
    signInitData(params, TEST_TOKEN);
    const initData = params.toString();

    expect(() => validateTelegramInitData(initData, [TEST_TOKEN])).toThrowError(AppError);
    try {
      validateTelegramInitData(initData, [TEST_TOKEN]);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).message).toBe('missing_user_data');
    }
  });
});
