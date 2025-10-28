import { runQuery } from '../repositories/base';
import { logger } from '../utils/logger';

interface ResetCountsRow {
  daily_reset: string | null;
  weekly_reset: string | null;
}

export class QuestResetScheduler {
  private intervalHandle: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(intervalMinutes = 15) {
    this.intervalMs = Math.max(intervalMinutes, 1) * 60 * 1000;
  }

  start(): void {
    if (this.intervalHandle) {
      return;
    }

    logger.info('Quest reset scheduler starting', { intervalMs: this.intervalMs });

    // fire-and-forget tick on boot
    void this.tick();

    this.intervalHandle = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.intervalHandle) {
      return;
    }
    clearInterval(this.intervalHandle);
    this.intervalHandle = null;
    logger.info('Quest reset scheduler stopped');
  }

  private async tick(now = new Date()): Promise<void> {
    try {
      const result = await runQuery<ResetCountsRow>(
        `
          WITH updated AS (
            UPDATE quest_progress
            SET
              baseline_value = baseline_value + progress_value,
              progress_value = 0,
              status = 'active',
              expires_at = CASE
                WHEN quest_type = 'weekly'
                  THEN date_trunc('week', $1::timestamptz) + INTERVAL '1 week'
                ELSE date_trunc('day', $1::timestamptz) + INTERVAL '1 day'
              END,
              last_progress_at = $1::timestamptz
            WHERE expires_at <= $1::timestamptz
            RETURNING quest_type
          )
          SELECT
            COUNT(*) FILTER (WHERE quest_type = 'daily') AS daily_reset,
            COUNT(*) FILTER (WHERE quest_type = 'weekly') AS weekly_reset
          FROM updated;
        `,
        [now.toISOString()]
      );

      const row = result.rows[0];
      const daily = row?.daily_reset ? Number(row.daily_reset) : 0;
      const weekly = row?.weekly_reset ? Number(row.weekly_reset) : 0;

      if (daily > 0 || weekly > 0) {
        logger.info('Quest reset scheduler tick completed', {
          dailyResets: daily,
          weeklyResets: weekly,
        });
      }
    } catch (error) {
      logger.error('Quest reset scheduler tick failed', {
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}

export const questResetScheduler = new QuestResetScheduler();
