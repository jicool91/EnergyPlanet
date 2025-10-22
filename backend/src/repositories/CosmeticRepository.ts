import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface CosmeticUpsert {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  rarity: string;
  unlockType: string;
  unlockRequirement: Record<string, unknown>;
  assetUrl?: string | null;
}

export async function upsertCosmetic(
  cosmetic: CosmeticUpsert,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `INSERT INTO cosmetics (
        id, name, description, category, rarity, unlock_type, unlock_requirement, asset_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        rarity = EXCLUDED.rarity,
        unlock_type = EXCLUDED.unlock_type,
        unlock_requirement = EXCLUDED.unlock_requirement,
        asset_url = EXCLUDED.asset_url,
        updated_at = NOW()`,
    [
      cosmetic.id,
      cosmetic.name,
      cosmetic.description ?? null,
      cosmetic.category,
      cosmetic.rarity,
      cosmetic.unlockType,
      JSON.stringify(cosmetic.unlockRequirement ?? {}),
      cosmetic.assetUrl ?? null,
    ],
    client
  );
}

export async function upsertCosmetics(
  cosmetics: CosmeticUpsert[],
  client?: PoolClient
): Promise<void> {
  for (const cosmetic of cosmetics) {
    await upsertCosmetic(cosmetic, client);
  }
}
