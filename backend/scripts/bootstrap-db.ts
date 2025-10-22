import { migrateUp, closeMigrationPool } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { connectDatabase, closeDatabase, transaction } from '../src/db/connection';
import { logger } from '../src/utils/logger';
import { findByTelegramId, createUser } from '../src/repositories/UserRepository';
import {
  getProgress,
  createDefaultProgress,
  updateProgress,
} from '../src/repositories/ProgressRepository';
import { ensureProfile } from '../src/repositories/ProfileRepository';

const DEMO_DEFAULTS = {
  telegramId: parseInt(process.env.BOOTSTRAP_DEMO_TELEGRAM_ID ?? '777000', 10),
  username: process.env.BOOTSTRAP_DEMO_USERNAME ?? 'demo_player',
  level: parseInt(process.env.BOOTSTRAP_DEMO_LEVEL ?? '5', 10),
  tapLevel: parseInt(process.env.BOOTSTRAP_DEMO_TAP_LEVEL ?? '2', 10),
  energy: parseInt(process.env.BOOTSTRAP_DEMO_ENERGY ?? '15000', 10),
  xp: parseInt(process.env.BOOTSTRAP_DEMO_XP ?? '1800', 10),
};

async function ensureDemoPlayer() {
  logger.info('Ensuring demo player exists', {
    telegramId: DEMO_DEFAULTS.telegramId,
    username: DEMO_DEFAULTS.username,
  });

  await transaction(async client => {
    let user = await findByTelegramId(DEMO_DEFAULTS.telegramId, client);

    if (!user) {
      user = await createUser(
        {
          telegramId: DEMO_DEFAULTS.telegramId,
          username: DEMO_DEFAULTS.username,
          firstName: 'Demo',
          lastName: 'Player',
        },
        client
      );
      logger.info('Created demo user', { userId: user.id });
    } else {
      logger.info('Demo user already exists', { userId: user.id });
    }

    await ensureProfile(user.id, client);

    let progress = await getProgress(user.id, client);
    if (!progress) {
      progress = await createDefaultProgress(user.id, client);
      logger.info('Created default progress for demo user', { userId: user.id });
    }

    const updatedProgress = await updateProgress(
      user.id,
      {
        level: Math.max(progress.level, DEMO_DEFAULTS.level),
        tapLevel: Math.max(progress.tapLevel, DEMO_DEFAULTS.tapLevel),
        xp: Math.max(progress.xp, DEMO_DEFAULTS.xp),
        energy: DEMO_DEFAULTS.energy,
        totalEnergyProduced: Math.max(progress.totalEnergyProduced, DEMO_DEFAULTS.energy),
        lastLogin: new Date(),
      },
      client
    );

    logger.info('Demo user progress ready', {
      userId: user.id,
      level: updatedProgress.level,
      xp: updatedProgress.xp,
      energy: updatedProgress.energy,
      tapLevel: updatedProgress.tapLevel,
    });
  });
}

async function main() {
  logger.info('Starting database bootstrap');

  try {
    logger.info('Applying migrations');
    await migrateUp();
    logger.info('Migrations applied successfully');
  } catch (error) {
    logger.error('Failed to apply migrations during bootstrap', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  } finally {
    await closeMigrationPool().catch(poolError => {
      logger.warn('Failed to close migration pool during bootstrap', {
        error: poolError instanceof Error ? poolError.message : poolError,
      });
    });
  }

  try {
    await connectDatabase();
    logger.info('Running seeders');
    await seedDatabase();
    logger.info('Seeders finished successfully');
    await ensureDemoPlayer();
  } finally {
    await closeDatabase().catch(dbError => {
      logger.warn('Failed to close primary database pool after bootstrap', {
        error: dbError instanceof Error ? dbError.message : dbError,
      });
    });
  }

  logger.info('Database bootstrap completed');
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
