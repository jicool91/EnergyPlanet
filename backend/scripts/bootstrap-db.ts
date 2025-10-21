import { migrateUp, closeMigrationPool } from '../src/db/migrate';
import { seedDatabase } from '../src/db/seed';
import { connectDatabase, closeDatabase } from '../src/db/connection';
import { logger } from '../src/utils/logger';

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
