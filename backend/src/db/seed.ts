/**
 * Seed helpers for local development
 */

import fs from 'fs/promises';
import path from 'path';
import { PoolClient } from 'pg';
import { connectDatabase, transaction } from './connection';
import { logger } from '../utils/logger';

interface CosmeticSeed {
  id: string;
  name: string;
  description?: string;
  category: string;
  rarity: string;
  unlock_type: string;
  unlock_requirement?: unknown;
  asset_url?: string;
}

const COSMETICS_PATH = path.join(__dirname, '../content/cosmetics/skins.json');

async function seedCosmetics(client: PoolClient) {
  try {
    const file = await fs.readFile(COSMETICS_PATH, 'utf-8');
    const parsed = JSON.parse(file) as { cosmetics?: CosmeticSeed[] };
    const cosmetics = parsed.cosmetics ?? [];

    if (!cosmetics.length) {
      logger.warn({}, 'cosmetics_payload_empty');
      return;
    }

    for (const cosmetic of cosmetics) {
      await client.query(
        `INSERT INTO cosmetics (id, name, description, category, rarity, unlock_type, unlock_requirement, asset_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id)
         DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           category = EXCLUDED.category,
           rarity = EXCLUDED.rarity,
           unlock_type = EXCLUDED.unlock_type,
           unlock_requirement = EXCLUDED.unlock_requirement,
           asset_url = EXCLUDED.asset_url,
           updated_at = NOW();`,
        [
          cosmetic.id,
          cosmetic.name,
          cosmetic.description ?? null,
          cosmetic.category,
          cosmetic.rarity,
          cosmetic.unlock_type,
          cosmetic.unlock_requirement ?? {},
          cosmetic.asset_url ?? null,
        ]
      );
    }

    logger.info({ count: cosmetics.length }, 'cosmetics_seeded');
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '42P01') {
      logger.warn({}, 'cosmetics_seeding_skipped_table_missing');
      return;
    }
    throw error;
  }
}

export async function seedDatabase() {
  await connectDatabase();

  await transaction(async client => {
    await seedCosmetics(client);
  });
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info({}, 'database_seed_completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'database_seed_failed'
      );
      process.exit(1);
    });
}
