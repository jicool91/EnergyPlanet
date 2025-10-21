/**
 * Admin Service
 * Provides operational insights for migrations and infrastructure health
 */

import fs from 'fs/promises';
import path from 'path';
import { QueryResultRow } from 'pg';
import { query } from '../db/connection';
import { healthCheck as databaseHealthCheck } from '../db/connection';
import { healthCheck as redisHealthCheck } from '../cache/redis';
import { logger } from '../utils/logger';

interface MigrationRow extends QueryResultRow {
  version: string;
  name: string;
  applied_at: Date;
}

export interface MigrationStatus {
  applied: number;
  pending: number;
  lastAppliedAt: string | null;
  migrations: {
    version: string;
    name: string;
    applied: boolean;
    appliedAt: string | null;
  }[];
}

export interface HealthStatus {
  status: 'ok' | 'degraded';
  checks: {
    database: {
      status: 'ok' | 'degraded';
      latencyMs: number | null;
    };
    redis: {
      status: 'ok' | 'degraded';
      latencyMs: number | null;
    };
    migrations: {
      status: 'ok' | 'degraded';
      applied: number;
      pending: number;
      lastAppliedAt: string | null;
    };
  };
  timestamp: string;
}

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

export class AdminService {
  async getMigrationStatus(): Promise<MigrationStatus> {
    const migrationFiles = await this.readMigrationFiles();
    const appliedRows = await this.fetchAppliedMigrations();

    const appliedVersions = new Set(appliedRows.map(row => row.version));
    const migrations = migrationFiles.map(file => {
      const applied = appliedVersions.has(file.version);
      const appliedRow = appliedRows.find(row => row.version === file.version) ?? null;

      return {
        version: file.version,
        name: file.name,
        applied,
        appliedAt: appliedRow?.applied_at ? appliedRow.applied_at.toISOString() : null,
      };
    });

    const applied = migrations.filter(m => m.applied).length;
    const pending = migrations.length - applied;
    const lastAppliedAt =
      appliedRows.length > 0
        ? appliedRows
            .slice()
            .sort((a, b) => (a.applied_at > b.applied_at ? -1 : 1))[0]
            .applied_at.toISOString()
        : null;

    return {
      applied,
      pending,
      lastAppliedAt,
      migrations,
    };
  }

  async getFullHealthStatus(): Promise<HealthStatus> {
    const migrationStatus = await this.getMigrationStatus();

    const [dbResult, redisResult] = await Promise.all([
      this.measureAsync(databaseHealthCheck),
      this.measureAsync(redisHealthCheck),
    ]);

    const databaseStatus = dbResult.success ? 'ok' : 'degraded' as const;
    const redisStatus = redisResult.success ? 'ok' : 'degraded' as const;
    const migrationsStatus = migrationStatus.pending === 0 ? 'ok' : 'degraded';
    const overallStatus: 'ok' | 'degraded' =
      databaseStatus === 'ok' && redisStatus === 'ok' && migrationsStatus === 'ok'
        ? 'ok'
        : 'degraded';

    return {
      status: overallStatus,
      checks: {
        database: {
          status: databaseStatus,
          latencyMs: dbResult.latencyMs,
        },
        redis: {
          status: redisStatus,
          latencyMs: redisResult.latencyMs,
        },
        migrations: {
          status: migrationsStatus,
          applied: migrationStatus.applied,
          pending: migrationStatus.pending,
          lastAppliedAt: migrationStatus.lastAppliedAt,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async readMigrationFiles(): Promise<{ version: string; name: string }[]> {
    let entries: string[];
    try {
      entries = await fs.readdir(MIGRATIONS_DIR);
    } catch (error: any) {
      if (error?.code === 'ENOENT') {
        logger.warn('Migrations directory not found when building status report', {
          directory: MIGRATIONS_DIR,
        });
        return [];
      }
      throw error;
    }
    return entries
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const match = file.match(/^(\d{3})_(.+)\.sql$/);
        if (!match) {
          logger.warn('Ignoring unexpected migration file', { file });
          return null;
        }
        return { version: match[1], name: match[2] };
      })
      .filter((entry): entry is { version: string; name: string } => entry !== null)
      .sort((a, b) => a.version.localeCompare(b.version));
  }

  private async fetchAppliedMigrations(): Promise<MigrationRow[]> {
    try {
      const result = await query<MigrationRow>(
        'SELECT version, name, applied_at FROM schema_migrations ORDER BY applied_at DESC'
      );
      return result.rows;
    } catch (error: any) {
      if (error?.code === '42P01') {
        logger.warn('schema_migrations table missing during status check');
        return [];
      }
      throw error;
    }
  }

  private async measureAsync(checkFn: () => Promise<boolean>): Promise<{
    success: boolean;
    latencyMs: number | null;
  }> {
    const start = Date.now();
    try {
      const success = await checkFn();
      return { success, latencyMs: Date.now() - start };
    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error),
        source: checkFn.name || 'unknown',
      });
      return { success: false, latencyMs: null };
    }
  }
}
