/**
 * Database Connection (PostgreSQL)
 * Подключение к базе данных через pg Pool
 */

import { Pool, PoolClient, PoolConfig, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export async function connectDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const poolConfig: PoolConfig = {
    min: config.database.poolMin,
    max: config.database.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };

  if (config.database.url) {
    poolConfig.connectionString = config.database.url;
  } else {
    Object.assign(poolConfig, {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
    });
  }

  if (config.database.ssl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(poolConfig);

  pool.on('error', err => {
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      'postgres_pool_error'
    );
  });

  // Test connection
  try {
    const result = await pool.query<{ current_time: string }>('SELECT NOW() as current_time');
    logger.info(
      {
        currentTime: result.rows[0]?.current_time,
        pool: { min: poolConfig.min, max: poolConfig.max },
      },
      'postgres_connection_ready'
    );
  } catch (err) {
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      'postgres_connection_failed'
    );
    throw err;
  }

  return pool;
}

export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info({}, 'postgres_pool_closed');
  }
}

/**
 * Выполнить SQL запрос
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const db = getDatabase();
  const start = Date.now();

  try {
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;

    if (duration >= config.logging.slowQueryThresholdMs) {
      logger.warn(
        {
          text,
          duration,
          rows: result.rowCount,
          thresholdMs: config.logging.slowQueryThresholdMs,
        },
        'postgres_slow_query'
      );
    }

    return result;
  } catch (error) {
    logger.error(
      {
        text,
        error: error instanceof Error ? error.message : String(error),
      },
      'postgres_query_failed'
    );
    throw error;
  }
}

/**
 * Выполнить транзакцию
 * @param callback - Функция с SQL операциями
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const db = getDatabase();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'postgres_transaction_failed'
    );
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Проверка здоровья БД
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'postgres_healthcheck_failed'
    );
    return false;
  }
}
