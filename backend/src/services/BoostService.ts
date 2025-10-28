import { transaction } from '../db/connection';
import { AppError } from '../middleware/errorHandler';
import {
  createBoost,
  findActiveBoostByType,
  getActiveBoosts,
  BoostRecord,
} from '../repositories/BoostRepository';
import { getLastBoostClaim, logEvent } from '../repositories/EventRepository';
import { addDuration } from '../utils/time';
import { loadPlayerContext } from './playerContext';
import { config } from '../config';
import { invalidateProfileCache } from '../cache/invalidation';
import { contentService } from './ContentService';

type BoostType = 'ad_boost' | 'daily_boost' | 'premium_boost';

interface BoostDefinition {
  multiplier: number;
  durationMinutes: number;
  cooldownMinutes: number;
  requiresPremium?: boolean;
}

type BoostOverrides = Partial<{
  ad_boost: {
    enabled?: boolean;
    duration_sec?: number;
    multiplier?: number;
    cooldown_sec?: number;
  };
  daily_boost: {
    enabled?: boolean;
    duration_sec?: number;
    multiplier?: number;
    cooldown_sec?: number;
  };
  premium_boosts: {
    enabled?: boolean;
    cooldown_sec?: number;
    items?: Array<{
      id?: string;
      duration_sec?: number;
      multiplier?: number;
      price_stars?: number;
    }>;
  };
}>;

function fromSeconds(value: number | undefined, fallbackMinutes: number): number {
  if (!value || value <= 0) {
    return fallbackMinutes;
  }
  return Math.max(1, Math.round(value / 60));
}

function resolveBoostDefinitions(): Record<BoostType, BoostDefinition> {
  const overrides = (contentService.getFeatureFlags()?.boosts ?? {}) as BoostOverrides;

  const defaults: Record<BoostType, BoostDefinition> = {
    ad_boost: {
      multiplier: 1.8,
      durationMinutes: 10,
      cooldownMinutes: 30,
    },
    daily_boost: {
      multiplier: 1.5,
      durationMinutes: 15,
      cooldownMinutes: 24 * 60,
    },
    premium_boost: {
      multiplier: 2.5,
      durationMinutes: 240,
      cooldownMinutes: 24 * 60,
      requiresPremium: true,
    },
  };

  const resolved: Record<BoostType, BoostDefinition> = { ...defaults };

  if (overrides.ad_boost?.enabled !== false) {
    resolved.ad_boost = {
      ...resolved.ad_boost,
      multiplier: overrides.ad_boost?.multiplier ?? resolved.ad_boost.multiplier,
      durationMinutes: fromSeconds(overrides.ad_boost?.duration_sec, resolved.ad_boost.durationMinutes),
      cooldownMinutes: fromSeconds(overrides.ad_boost?.cooldown_sec, resolved.ad_boost.cooldownMinutes),
    };
  }

  if (overrides.daily_boost?.enabled !== false) {
    resolved.daily_boost = {
      ...resolved.daily_boost,
      multiplier: overrides.daily_boost?.multiplier ?? resolved.daily_boost.multiplier,
      durationMinutes: fromSeconds(
        overrides.daily_boost?.duration_sec,
        resolved.daily_boost.durationMinutes
      ),
      cooldownMinutes: fromSeconds(
        overrides.daily_boost?.cooldown_sec,
        resolved.daily_boost.cooldownMinutes
      ),
    };
  }

  const premiumItems = overrides.premium_boosts?.items;
  if (premiumItems && Array.isArray(premiumItems) && premiumItems.length > 0) {
    const defaultItem = premiumItems[0];
    resolved.premium_boost = {
      ...resolved.premium_boost,
      multiplier: defaultItem.multiplier ?? resolved.premium_boost.multiplier,
      durationMinutes: fromSeconds(defaultItem.duration_sec, resolved.premium_boost.durationMinutes),
      cooldownMinutes: fromSeconds(
        overrides.premium_boosts?.cooldown_sec,
        resolved.premium_boost.cooldownMinutes
      ),
    };
  }

  return resolved;
}

export class BoostService {
  getDefinitions() {
    return resolveBoostDefinitions();
  }

  async getBoostHub(userId: string) {
    const definitions = this.getDefinitions();
    const activeBoosts = await getActiveBoosts(userId);
    const now = new Date();

    const entries = await Promise.all(
      (Object.keys(definitions) as BoostType[]).map(async boostType => {
        const definition = definitions[boostType];
        const active = activeBoosts.find(boost => boost.boostType === boostType) ?? null;

        const lastClaim = await getLastBoostClaim(userId, boostType);
        const availableAt = lastClaim
          ? new Date(lastClaim.getTime() + definition.cooldownMinutes * 60_000)
          : now;
        const cooldownRemainingMs = Math.max(availableAt.getTime() - now.getTime(), 0);

        let activePayload: null | {
          id: string;
          expires_at: string;
          remaining_seconds: number;
        } = null;

        if (active) {
          const remainingSeconds = Math.max(
            Math.ceil((active.expiresAt.getTime() - now.getTime()) / 1000),
            0
          );
          activePayload = {
            id: active.id,
            expires_at: active.expiresAt.toISOString(),
            remaining_seconds: remainingSeconds,
          };
        }

        return {
          boost_type: boostType,
          multiplier: definition.multiplier,
          duration_minutes: definition.durationMinutes,
          cooldown_minutes: definition.cooldownMinutes,
          requires_premium: Boolean(definition.requiresPremium),
          active: activePayload,
          cooldown_remaining_seconds: Math.ceil(cooldownRemainingMs / 1000),
          available_at: availableAt.toISOString(),
        };
      })
    );

    return {
      server_time: now.toISOString(),
      boosts: entries,
    };
  }

  async listBoosts(userId: string): Promise<BoostRecord[]> {
    return getActiveBoosts(userId);
  }

  async claimBoost(userId: string, boostType: BoostType): Promise<BoostRecord> {
    const definitions = this.getDefinitions();
    const definition = definitions[boostType];

    if (!definition) {
      throw new AppError(400, 'unknown_boost_type');
    }

    const result = await transaction(async client => {
      await loadPlayerContext(userId, client);

      if (definition.requiresPremium && !config.monetization.starsEnabled && !config.testing.mockPayments) {
        throw new AppError(403, 'premium_boost_unavailable');
      }

      const active = await findActiveBoostByType(userId, boostType, client);
      if (active) {
        throw new AppError(409, 'boost_already_active');
      }

      const lastClaim = await getLastBoostClaim(userId, boostType, client);
      if (lastClaim) {
        const now = new Date();
        const elapsedMinutes = (now.getTime() - lastClaim.getTime()) / 60000;
        if (elapsedMinutes < definition.cooldownMinutes) {
          const remaining = Math.ceil(definition.cooldownMinutes - elapsedMinutes);
          throw new AppError(429, `boost_cooldown_${remaining}`);
        }
      }

      const expiresAt = addDuration(new Date(), `${definition.durationMinutes}m`);
      const boost = await createBoost(
        userId,
        boostType,
        definition.multiplier,
        expiresAt,
        client
      );

      await logEvent(
        userId,
        'boost_claim',
        {
          boost_type: boostType,
          multiplier: definition.multiplier,
          duration_minutes: definition.durationMinutes,
        },
        { client }
      );

      // Log also as activation event for analytics
      await logEvent(
        userId,
        'boost_activate',
        {
          boost_type: boostType,
          expires_at: boost.expiresAt.toISOString(),
        },
        { client }
      );

      return boost;
    });

    await invalidateProfileCache(userId);
    return result;
  }
}

export const boostService = new BoostService();
