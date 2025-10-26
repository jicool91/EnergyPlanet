/**
 * Telegram initData validation utilities.
 *
 * Based on the Telegram WebApp authentication specification:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */

import crypto from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { logger } from './logger';
import { config } from '../config';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface TelegramInitDataResult {
  telegramUser: TelegramUser;
  matchedBotToken: string;
}

const maskSensitive = (value: string | null) => {
  if (!value) {
    return null;
  }
  if (value.length <= 8) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const buildDataCheckString = (entries: [string, string][]) =>
  entries
    .slice()
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

const summarizePayload = (payload: string) => ({
  length: payload.length,
  preview: payload.length > 180 ? `${payload.slice(0, 120)}…${payload.slice(-30)}` : payload,
  sha256: crypto.createHash('sha256').update(payload).digest('hex'),
});

export function validateTelegramInitData(
  initData: string,
  botTokens: string[]
): TelegramInitDataResult {
  if (!botTokens.length) {
    throw new AppError(500, 'telegram_bot_token_missing');
  }

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');

  logger.debug('Telegram init data received', {
    initDataLength: initData.length,
    keys: Array.from(urlParams.keys()),
    hashPresent: Boolean(hash),
    botTokenSnippets: botTokens.map(maskSensitive),
  });

  if (!hash) {
    logger.warn('Telegram init data missing hash', {
      initDataLength: initData.length,
      keys: Array.from(urlParams.keys()),
    });
    throw new AppError(401, 'missing_telegram_hash');
  }

  const entries = Array.from(urlParams.entries());
  const filteredEntries = entries.filter(([key]) => key !== 'hash');
  const defaultDataCheckString = buildDataCheckString(filteredEntries);
  const withoutSignatureDataCheckString = buildDataCheckString(
    filteredEntries.filter(([key]) => key !== 'signature')
  );

  const defaultSummary = summarizePayload(defaultDataCheckString);
  const withoutSignatureSummary = summarizePayload(withoutSignatureDataCheckString);

  logger.debug('Telegram data_check_string prepared', {
    default: defaultSummary,
    withoutSignature: withoutSignatureSummary,
  });

  let matchedVariant: 'default' | 'no_signature' | null = null;
  let matchedBotToken: string | null = null;
  let lastExpectedDefault: string | null = null;
  let lastExpectedWithoutSignature: string | null = null;

  for (const candidateToken of botTokens) {
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(candidateToken).digest();

    const calculateHash = (data: string) =>
      crypto.createHmac('sha256', secretKey).update(data).digest('hex');

    const calculatedHashDefault = calculateHash(defaultDataCheckString);
    const calculatedHashWithoutSignature = calculateHash(withoutSignatureDataCheckString);

    lastExpectedDefault = calculatedHashDefault;
    lastExpectedWithoutSignature = calculatedHashWithoutSignature;

    if (calculatedHashDefault === hash) {
      matchedVariant = 'default';
      matchedBotToken = candidateToken;
      break;
    }

    if (calculatedHashWithoutSignature === hash) {
      matchedVariant = 'no_signature';
      matchedBotToken = candidateToken;
      break;
    }

    logger.debug('Telegram hash mismatch for candidate token', {
      providedHash: maskSensitive(hash),
      expectedHashDefault: maskSensitive(calculatedHashDefault),
      expectedHashWithoutSignature: maskSensitive(calculatedHashWithoutSignature),
      candidateToken: maskSensitive(candidateToken),
    });
  }

  if (!matchedVariant || !matchedBotToken) {
    logger.error('Telegram hash validation failed', {
      providedHash: maskSensitive(hash),
      expectedHashDefault: maskSensitive(lastExpectedDefault),
      expectedHashWithoutSignature: maskSensitive(lastExpectedWithoutSignature),
      initDataLength: initData.length,
      keys: Array.from(urlParams.keys()),
      botTokenCandidates: botTokens.map(maskSensitive),
      defaultDataCheck: defaultSummary,
      withoutSignatureDataCheck: withoutSignatureSummary,
    });
    throw new AppError(401, 'invalid_telegram_hash');
  }

  if (matchedVariant === 'no_signature') {
    logger.info('Telegram hash matched after removing signature key', {
      initDataLength: initData.length,
      keys: Array.from(urlParams.keys()),
      botTokenUsed: maskSensitive(matchedBotToken),
      variant: matchedVariant,
    });
  } else {
    logger.debug('Telegram hash matched with default payload', {
      initDataLength: initData.length,
      keys: Array.from(urlParams.keys()),
      botTokenUsed: maskSensitive(matchedBotToken),
      variant: matchedVariant,
    });
  }

  const userParam = urlParams.get('user');
  if (!userParam) {
    logger.warn('Telegram init data missing user payload', {
      keys: Array.from(urlParams.keys()),
    });
    throw new AppError(401, 'missing_user_data');
  }

  const parsed = JSON.parse(userParam) as TelegramUser;

  const authDateRaw = urlParams.get('auth_date') || '0';
  const authDate = parseInt(authDateRaw, 10);
  const now = Math.floor(Date.now() / 1000);
  const maxAgeSec = Math.max(config.telegram.authDataMaxAgeSec, 0);
  const ageSeconds = now - authDate;

  if (Number.isNaN(authDate) || authDate <= 0) {
    logger.warn('Telegram auth data has invalid auth_date', {
      authDate: authDateRaw,
      now,
      maxAgeSec,
    });
    throw new AppError(401, 'auth_data_invalid');
  }

  if (ageSeconds > maxAgeSec) {
    logger.warn('Telegram auth data expired', {
      authDate,
      now,
      ageSeconds,
      maxAgeSec,
    });
    throw new AppError(401, 'auth_data_expired');
  }

  return {
    telegramUser: parsed,
    matchedBotToken,
  };
}
