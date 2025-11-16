import { connectDatabase, closeDatabase, transaction } from '../src/db/connection';
import { runQuery } from '../src/repositories/base';
import { logger } from '../src/utils/logger';
import { calculateLevelProgressV2, cumulativeXpToLevel, MAX_LEVEL_V2 } from '../src/utils/levelV2';
import { updateProgress } from '../src/repositories/ProgressRepository';

async function migrateProgress() {
  const { rows } = await runQuery<{
    user_id: string;
    level: number;
    xp: string;
    stars_balance: string;
  }>(`SELECT user_id, level, xp, stars_balance FROM progress`);

  const capBaseline = cumulativeXpToLevel(MAX_LEVEL_V2 - 1);
  let migrated = 0;
  let starsGranted = 0;

  for (const row of rows) {
    const totalXp = Number(row.xp);
    const previousLevel = row.level;
    const levelProgress = calculateLevelProgressV2(totalXp);
    const cappedLevel = Math.min(levelProgress.level, MAX_LEVEL_V2);
    const xpOverflow = cappedLevel === MAX_LEVEL_V2 ? Math.max(0, totalXp - capBaseline) : 0;
    const compensation = previousLevel > cappedLevel ? (previousLevel - cappedLevel) * 5 : 0;

    await transaction(async client => {
      await updateProgress(
        row.user_id,
        {
          level: cappedLevel,
          xp: totalXp,
          xpOverflow,
          starsBalance: Number(row.stars_balance ?? '0') + compensation,
        },
        client
      );
    });

    migrated += 1;
    starsGranted += compensation;
  }

  logger.info('XP overhaul migration complete', {
    migrated,
    starsGranted,
  });
}

async function autoCompleteJobs() {
  const result = await runQuery<{ count: string }>(
    `WITH updated AS (
      UPDATE construction_jobs
      SET status = 'completed', completed_at = NOW(), reward_claimed_at = NOW()
      WHERE status IN ('queued', 'running')
      RETURNING 1
    ) SELECT COUNT(*)::text AS count FROM updated`
  );
  const completed = Number(result.rows?.[0]?.count ?? '0');
  if (completed > 0) {
    logger.info('Auto-completed legacy construction jobs', { completed });
  }
}

async function main() {
  try {
    await connectDatabase();
    await migrateProgress();
    await autoCompleteJobs();
  } finally {
    await closeDatabase();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('XP overhaul migration failed', { error: error instanceof Error ? error.message : error });
      process.exit(1);
    });
}
