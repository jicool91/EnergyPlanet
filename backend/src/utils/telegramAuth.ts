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
  startParam: string | null;
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

  logger.debug(
    {
      initDataLength: initData.length,
      keys: Array.from(urlParams.keys()),
      hashPresent: Boolean(hash),
      botTokenSnippets: botTokens.map(maskSensitive),
    },
    'telegram_init_data_received'
  );

  if (!hash) {
    logger.warn(
      {
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
      },
      'telegram_init_data_missing_hash'
    );
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

  logger.debug(
    {
      default: defaultSummary,
      withoutSignature: withoutSignatureSummary,
    },
    'telegram_data_check_string_prepared'
  );

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

    logger.debug(
      {
        providedHash: maskSensitive(hash),
        expectedHashDefault: maskSensitive(calculatedHashDefault),
        expectedHashWithoutSignature: maskSensitive(calculatedHashWithoutSignature),
        candidateToken: maskSensitive(candidateToken),
      },
      'telegram_hash_mismatch_candidate'
    );
  }

  if (!matchedVariant || !matchedBotToken) {
    logger.error(
      {
        providedHash: maskSensitive(hash),
        expectedHashDefault: maskSensitive(lastExpectedDefault),
        expectedHashWithoutSignature: maskSensitive(lastExpectedWithoutSignature),
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
        botTokenCandidates: botTokens.map(maskSensitive),
        defaultDataCheck: defaultSummary,
        withoutSignatureDataCheck: withoutSignatureSummary,
      },
      'telegram_hash_validation_failed'
    );
    throw new AppError(401, 'invalid_telegram_hash');
  }

  if (matchedVariant === 'no_signature') {
    logger.info(
      {
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
        botTokenUsed: maskSensitive(matchedBotToken),
        variant: matchedVariant,
      },
      'telegram_hash_matched_without_signature'
    );
  } else {
    logger.debug(
      {
        initDataLength: initData.length,
        keys: Array.from(urlParams.keys()),
        botTokenUsed: maskSensitive(matchedBotToken),
        variant: matchedVariant,
      },
      'telegram_hash_matched_default'
    );
  }

  const userParam = urlParams.get('user');
  if (!userParam) {
    logger.warn(
      {
        keys: Array.from(urlParams.keys()),
      },
      'telegram_init_data_missing_user_payload'
    );
    throw new AppError(401, 'missing_user_data');
  }

  const parsed = JSON.parse(userParam) as TelegramUser;

  const rawStartParam = urlParams.get('start_param');
  let startParam: string | null = null;
  if (typeof rawStartParam === 'string' && rawStartParam.trim().length > 0) {
    const normalized = rawStartParam.trim();
    const isValidFormat = /^[A-Za-z0-9_-]{1,512}$/.test(normalized);
    if (isValidFormat) {
      startParam = normalized;
    } else {
      logger.warn(
        {
          length: normalized.length,
          preview:
            normalized.length > 32
              ? `${normalized.slice(0, 16)}…${normalized.slice(-8)}`
              : normalized,
        },
        'telegram_start_param_invalid_format'
      );
    }
  }

  const authDateRaw = urlParams.get('auth_date') || '0';
  const authDate = parseInt(authDateRaw, 10);
  const now = Math.floor(Date.now() / 1000);
  const maxAgeSec = Math.max(config.telegram.authDataMaxAgeSec, 0);
  const ageSeconds = now - authDate;

  if (Number.isNaN(authDate) || authDate <= 0) {
    logger.warn(
      {
        authDate: authDateRaw,
        now,
        maxAgeSec,
      },
      'telegram_auth_date_invalid'
    );
    throw new AppError(401, 'auth_data_invalid');
  }

  if (maxAgeSec > 0) {
    const nearExpiryWindowSec = 4 * 3600; // 4 часа по умолчанию
    if (ageSeconds >= Math.max(maxAgeSec - nearExpiryWindowSec, 0) && ageSeconds <= maxAgeSec) {
      logger.warn(
        {
          authDate,
          now,
          ageSeconds,
          maxAgeSec,
        },
        'telegram_auth_data_near_expiry'
      );
    }
  }

  if (ageSeconds > maxAgeSec) {
    logger.warn(
      {
        authDate,
        now,
        ageSeconds,
        maxAgeSec,
      },
      'telegram_auth_data_expired'
    );
    throw new AppError(401, 'auth_data_expired');
  }

  return {
    telegramUser: parsed,
    matchedBotToken,
    startParam,
  };
}
