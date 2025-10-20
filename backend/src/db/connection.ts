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

  pool.on('connect', () => {
    logger.info('✅ PostgreSQL: Новое подключение к пулу');
  });

  pool.on('error', (err) => {
    logger.error('❌ PostgreSQL: Ошибка пула подключений', err);
  });

  // Test connection
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    logger.info('✅ PostgreSQL: Подключение установлено', result.rows[0]);
  } catch (err) {
    logger.error('❌ PostgreSQL: Не удалось подключиться к БД', err);
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
    logger.info('🔌 PostgreSQL: Все подключения закрыты');
  }
}

/**
 * Выполнить SQL запрос
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const db = getDatabase();
  const start = Date.now();

  try {
    const result = await db.query<T>(text, params);
    const duration = Date.now() - start;

    if (config.logging.level === 'debug') {
      logger.debug('🔍 DB Query', { text, duration, rows: result.rowCount });
    }

    return result;
  } catch (error) {
    logger.error('❌ DB Query Error', { text, error });
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
    logger.error('❌ Transaction Error', error);
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
    logger.error('❌ DB Health check failed', error);
    return false;
  }
}
