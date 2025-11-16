import { connectDatabase, closeDatabase } from '../src/db/connection';
import { SeasonService } from '../src/services/SeasonService';
import { logger } from '../src/utils/logger';

interface CliOptions {
  force: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    force: false,
  };

  for (const arg of argv) {
    if (arg === '--force') {
      options.force = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const seasonService = new SeasonService();

  await connectDatabase();

  try {
    const result = await seasonService.distributeLeaderboardRewards({ force: options.force });
    if (result.skipped) {
      logger.warn('Season reward distribution skipped', result);
    } else {
      logger.info('Season reward distribution complete', result);
    }
  } finally {
    await closeDatabase().catch(error => {
      logger.warn('Failed to close database after season reward distribution', {
        error: error instanceof Error ? error.message : error,
      });
    });
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Season reward distribution failed', {
        error: error instanceof Error ? error.message : error,
      });
      process.exit(1);
    });
}
