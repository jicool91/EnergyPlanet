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

type BoostType = 'ad_boost' | 'daily_boost' | 'premium_boost';

interface BoostDefinition {
  multiplier: number;
  durationMinutes: number;
  cooldownMinutes: number;
  requiresPremium?: boolean;
}

const BOOST_DEFINITIONS: Record<BoostType, BoostDefinition> = {
  ad_boost: {
    multiplier: 2,
    durationMinutes: 30,
    cooldownMinutes: 60,
  },
  daily_boost: {
    multiplier: 3,
    durationMinutes: 120,
    cooldownMinutes: 24 * 60,
  },
  premium_boost: {
    multiplier: 4,
    durationMinutes: 240,
    cooldownMinutes: 24 * 60,
    requiresPremium: true,
  },
};

export class BoostService {
  getDefinitions() {
    return BOOST_DEFINITIONS;
  }

  async listBoosts(userId: string): Promise<BoostRecord[]> {
    return getActiveBoosts(userId);
  }

  async claimBoost(userId: string, boostType: BoostType): Promise<BoostRecord> {
    const definition = BOOST_DEFINITIONS[boostType];

    if (!definition) {
      throw new AppError(400, 'unknown_boost_type');
    }

    return transaction(async client => {
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
  }
}

export const boostService = new BoostService();
