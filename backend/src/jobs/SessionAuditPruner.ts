import { config } from '../config';
import { pruneSessionRefreshAuditOlderThan } from '../repositories/SessionRepository';
import { logger } from '../utils/logger';

export class SessionAuditPruner {
  private intervalHandle: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(intervalMinutes = 60) {
    this.intervalMs = Math.max(intervalMinutes, 15) * 60 * 1000;
  }

  start(): void {
    if (this.intervalHandle) {
      return;
    }

    logger.info({ intervalMs: this.intervalMs }, 'session_audit_pruner_started');

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
    logger.info({}, 'session_audit_pruner_stopped');
  }

  private async tick(): Promise<void> {
    const retentionDays = Math.max(config.security.refreshAuditRetentionDays, 1);
    if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
      return;
    }

    try {
      const deleted = await pruneSessionRefreshAuditOlderThan(retentionDays);
      if (deleted > 0) {
        logger.info(
          {
            deleted,
            retentionDays,
          },
          'session_audit_pruner_completed'
        );
      }
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        'session_audit_pruner_failed'
      );
    }
  }
}

export const sessionAuditPruner = new SessionAuditPruner();
