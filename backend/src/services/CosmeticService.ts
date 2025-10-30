import { AppError } from '../middleware/errorHandler';
import { contentService } from './ContentService';
import { transaction } from '../db/connection';
import { loadPlayerContext, PlayerContext } from './playerContext';
import {
  addUserCosmetic,
  listUserCosmetics,
} from '../repositories/UserCosmeticsRepository';
import { updateEquipment, UpdateEquipmentInput } from '../repositories/ProfileRepository';
import { logEvent } from '../repositories/EventRepository';
import { config } from '../config';
import { invalidateProfileCache } from '../cache/invalidation';
import { upsertCosmetics } from '../repositories/CosmeticRepository';
import { adjustStarsBalance } from '../repositories/ProgressRepository';
import { recordCosmeticEquipMetric, recordCosmeticGrantedMetric } from '../metrics/gameplay';

type UnlockType = 'free' | 'level' | 'purchase' | 'event';

interface CosmeticUnlockRequirement {
  level?: number;
  price_stars?: number;
  event_id?: string;
  [key: string]: unknown;
}

interface CosmeticListItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  unlock_type: UnlockType;
  unlock_requirement: CosmeticUnlockRequirement;
  asset_url?: string;
  preview_url?: string;
  owned: boolean;
  equipped: boolean;
  status: 'owned' | 'locked' | 'purchase_required' | 'event_locked';
  price_stars?: number | null;
}

const CATEGORY_TO_PROFILE_FIELD: Record<string, keyof UpdateEquipmentInput> = {
  avatar_frame: 'avatarFrame',
  planet_skin: 'planetSkin',
  tap_effect: 'tapEffect',
  background: 'background',
};

const CATEGORY_TO_PROFILE_RECORD_FIELD: Record<string, keyof PlayerContext['profile']> = {
  avatar_frame: 'equippedAvatarFrame',
  planet_skin: 'equippedPlanetSkin',
  tap_effect: 'equippedTapEffect',
  background: 'equippedBackground',
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const toOptionalString = (value: unknown): string | null => {
  return typeof value === 'string' ? value : null;
};

let cosmeticsSeedPromise: Promise<void> | null = null;

async function ensureCosmeticsSeeded(): Promise<void> {
  if (!cosmeticsSeedPromise) {
    cosmeticsSeedPromise = (async () => {
      const cosmetics = contentService.getCosmetics();
      if (!cosmetics.length) {
        return;
      }

      await transaction(async client => {
        await upsertCosmetics(
          cosmetics.map(cosmetic => ({
            id: cosmetic.id,
            name: cosmetic.name,
            description: toOptionalString(cosmetic.description),
            category: cosmetic.category,
            rarity: cosmetic.rarity,
            unlockType: cosmetic.unlock_type ?? 'free',
            unlockRequirement: isRecord(cosmetic.unlock_requirement) ? cosmetic.unlock_requirement : {},
            assetUrl: toOptionalString(cosmetic.asset_url),
          })),
          client
        );
      });
    })().catch(error => {
      cosmeticsSeedPromise = null;
      throw error;
    });
  }

  return cosmeticsSeedPromise;
}

function extractPrice(requirement: CosmeticUnlockRequirement): number | null {
  if (typeof requirement?.price_stars === 'number') {
    return requirement.price_stars;
  }
  return null;
}

function shouldAutoUnlock(
  unlockType: UnlockType,
  requirement: CosmeticUnlockRequirement,
  userLevel: number
): boolean {
  if (unlockType === 'free') {
    return true;
  }

  if (unlockType === 'level') {
    const requiredLevel = requirement?.level ?? Infinity;
    return userLevel >= requiredLevel;
  }

  return false;
}

function ensureProfileField(category: string): keyof UpdateEquipmentInput {
  const key = CATEGORY_TO_PROFILE_FIELD[category];
  if (!key) {
    throw new AppError(400, 'unsupported_cosmetic_category');
  }
  return key;
}

async function grantCosmetic(
  userId: string,
  cosmeticId: string,
  ownedSet: Set<string>,
  client: Parameters<typeof addUserCosmetic>[2],
  source: 'auto_unlock' | 'purchase' | 'reward'
): Promise<boolean> {
  if (ownedSet.has(cosmeticId)) {
    return false;
  }
  await addUserCosmetic(userId, cosmeticId, client);
  ownedSet.add(cosmeticId);
  recordCosmeticGrantedMetric({ cosmeticId, source });
  return true;
}

function determineStatus(
  unlockType: UnlockType,
  owned: boolean
): CosmeticListItem['status'] {
  if (owned) {
    return 'owned';
  }

  if (unlockType === 'purchase') {
    return 'purchase_required';
  }

  if (unlockType === 'event') {
    return 'event_locked';
  }

  return 'locked';
}

export class CosmeticService {
  async listCosmetics(userId: string): Promise<CosmeticListItem[]> {
    await ensureCosmeticsSeeded();

    const result = await transaction(async client => {
      const context = await loadPlayerContext(userId, client);
      const ownedSet = new Set(context.cosmetics.map(c => c.cosmeticId));
      const cosmetics = contentService.getCosmetics();

      // Automatically grant free / level-based cosmetics once requirements met
      for (const cosmetic of cosmetics) {
        const unlockType = (cosmetic.unlock_type ?? 'free') as UnlockType;
        const requirement = (cosmetic.unlock_requirement ?? {}) as CosmeticUnlockRequirement;
        if (shouldAutoUnlock(unlockType, requirement, context.progress.level)) {
          await grantCosmetic(userId, cosmetic.id, ownedSet, client, 'auto_unlock');
        }
      }

      const updatedOwnership = await listUserCosmetics(userId, client);
      const ownedLatest = new Set(updatedOwnership.map(c => c.cosmeticId));

      return cosmetics.map<CosmeticListItem>(cosmetic => {
        const unlockType = (cosmetic.unlock_type ?? 'free') as UnlockType;
        const requirement = isRecord(cosmetic.unlock_requirement)
          ? (cosmetic.unlock_requirement as CosmeticUnlockRequirement)
          : {};
        const owned = ownedLatest.has(cosmetic.id) || shouldAutoUnlock(unlockType, requirement, context.progress.level);
        const profileField = CATEGORY_TO_PROFILE_RECORD_FIELD[cosmetic.category];
        const equippedValue = profileField ? context.profile[profileField] : null;
        const priceStars = extractPrice(requirement);

        return {
          id: cosmetic.id,
          name: cosmetic.name,
          description: typeof cosmetic.description === 'string' ? cosmetic.description : '',
          category: cosmetic.category,
          rarity: cosmetic.rarity,
          unlock_type: unlockType,
          unlock_requirement: requirement,
          asset_url: toOptionalString(cosmetic.asset_url) ?? undefined,
          preview_url: toOptionalString(cosmetic.preview_url) ?? undefined,
          owned,
          equipped: equippedValue === cosmetic.id,
          status: determineStatus(unlockType, owned),
          price_stars: priceStars,
        };
      });
    });

    await invalidateProfileCache(userId);
    return result;
  }

  async purchaseCosmetic(userId: string, cosmeticId: string): Promise<void> {
    await transaction(async client => {
      const context = await loadPlayerContext(userId, client);
      const cosmetic = contentService.getCosmetic(cosmeticId);

      if (!cosmetic) {
        throw new AppError(404, 'cosmetic_not_found');
      }

      const unlockType = (cosmetic.unlock_type ?? 'free') as UnlockType;
      const requirement = (cosmetic.unlock_requirement ?? {}) as CosmeticUnlockRequirement;
      const ownedSet = new Set(context.cosmetics.map(c => c.cosmeticId));

      if (ownedSet.has(cosmeticId) || shouldAutoUnlock(unlockType, requirement, context.progress.level)) {
        // Already owned or auto-eligible
        await grantCosmetic(userId, cosmeticId, ownedSet, client, 'auto_unlock');
        return;
      }

      switch (unlockType) {
        case 'purchase': {
          const priceStars = extractPrice(requirement);

          if (!priceStars) {
            throw new AppError(400, 'invalid_cosmetic_price');
          }

          const purchaseAllowed = config.monetization.starsEnabled || config.testing.mockPayments;
          if (!purchaseAllowed) {
            throw new AppError(403, 'purchases_disabled');
          }

          const availableStars = context.progress.starsBalance ?? 0;
          if (availableStars < priceStars) {
            throw new AppError(402, 'not_enough_stars');
          }

          let balanceAfter: number;
          try {
            balanceAfter = await adjustStarsBalance(userId, -priceStars, client);
          } catch (error) {
            if (error instanceof Error && error.message === 'insufficient_stars') {
              throw new AppError(402, 'not_enough_stars');
            }
            throw error;
          }

          await logEvent(
            userId,
            'stars_balance_debit',
            {
              source: 'cosmetic_purchase',
              cosmetic_id: cosmeticId,
              amount: priceStars,
              balance_after: balanceAfter,
            },
            { client }
          );

          await grantCosmetic(userId, cosmeticId, ownedSet, client, 'purchase');
          await logEvent(
            userId,
            'cosmetic_purchase',
            {
              cosmetic_id: cosmeticId,
              price_stars: priceStars,
              source: config.testing.mockPayments ? 'mock' : 'stars',
              balance_after: balanceAfter,
            },
            { client }
          );
          break;
        }
        case 'level': {
          const requiredLevel = requirement?.level ?? Infinity;
          if (context.progress.level < requiredLevel) {
            throw new AppError(403, 'level_requirement_not_met');
          }
          await grantCosmetic(userId, cosmeticId, ownedSet, client, 'auto_unlock');
          break;
        }
        case 'free': {
          await grantCosmetic(userId, cosmeticId, ownedSet, client, 'auto_unlock');
          break;
        }
        case 'event':
        default:
          throw new AppError(403, 'cosmetic_locked');
      }
    });

    await invalidateProfileCache(userId);
  }

  async equipCosmetic(userId: string, cosmeticId: string): Promise<void> {
    await transaction(async client => {
      const context = await loadPlayerContext(userId, client);
      const cosmetic = contentService.getCosmetic(cosmeticId);

      if (!cosmetic) {
        throw new AppError(404, 'cosmetic_not_found');
      }

      const unlockType = (cosmetic.unlock_type ?? 'free') as UnlockType;
      const requirement = (cosmetic.unlock_requirement ?? {}) as CosmeticUnlockRequirement;
      const ownedSet = new Set(context.cosmetics.map(c => c.cosmeticId));

      if (!ownedSet.has(cosmeticId) && !shouldAutoUnlock(unlockType, requirement, context.progress.level)) {
        throw new AppError(403, 'cosmetic_not_owned');
      }

      await grantCosmetic(userId, cosmeticId, ownedSet, client, 'auto_unlock');

      const profileField = ensureProfileField(cosmetic.category);
      await updateEquipment(
        userId,
        { [profileField]: cosmeticId } as UpdateEquipmentInput,
        client
      );

      await logEvent(
        userId,
        'cosmetic_equip',
        {
          cosmetic_id: cosmeticId,
          category: cosmetic.category,
        },
        { client }
      );
      recordCosmeticEquipMetric({
        cosmeticId,
        category: cosmetic.category,
      });
    });

    await invalidateProfileCache(userId);
  }
}

export const cosmeticService = new CosmeticService();
