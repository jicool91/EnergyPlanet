import { PoolClient } from 'pg';
import { AppError } from '../middleware/errorHandler';
import {
  findById as findUserById,
  UserRecord,
} from '../repositories/UserRepository';
import {
  createDefaultProgress,
  getProgress,
  ProgressRecord,
} from '../repositories/ProgressRepository';
import { listInventory, InventoryRecord } from '../repositories/InventoryRepository';
import { getActiveBoosts, BoostRecord } from '../repositories/BoostRepository';
import { ensureProfile, getProfile, UserProfileRecord } from '../repositories/ProfileRepository';
import {
  listUserCosmetics,
  UserCosmeticRecord,
} from '../repositories/UserCosmeticsRepository';

export interface PlayerContext {
  user: UserRecord;
  progress: ProgressRecord;
  inventory: InventoryRecord[];
  boosts: BoostRecord[];
  profile: UserProfileRecord;
  cosmetics: UserCosmeticRecord[];
}

export async function loadPlayerContext(
  userId: string,
  client?: PoolClient
): Promise<PlayerContext> {
  const user = await findUserById(userId, client);
  if (!user) {
    throw new AppError(404, 'user_not_found');
  }

  const progress =
    (await getProgress(userId, client)) ?? (await createDefaultProgress(userId, client));
  const inventory = await listInventory(userId, client);
  const boosts = await getActiveBoosts(userId, client);
  const profile = (await getProfile(userId, client)) ?? (await ensureProfile(userId, client));
  const cosmetics = await listUserCosmetics(userId, client);

  return { user, progress, inventory, boosts, profile, cosmetics };
}
