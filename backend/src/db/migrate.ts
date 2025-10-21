/**
 * Database Migration Runner
 * Запуск SQL миграций из папки migrations/
 */

import fs from 'fs/promises';
import path from 'path';
import { Pool } from 'pg';
import config from '../config';

const migrationsDir = path.join(__dirname, '../../migrations');

// Создаем отдельное подключение для миграций
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});

/**
 * Создать таблицу для отслеживания миграций
 */
async function createMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Таблица schema_migrations готова');
}

/**
 * Получить список примененных миграций
 */
async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  return new Set(result.rows.map((row) => row.version));
}

/**
 * Получить список файлов миграций
 */
async function getMigrationFiles(): Promise<{ version: string; name: string; path: string }[]> {
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files
    .filter((file) => file.endsWith('.sql'))
    .sort();

  return sqlFiles.map((file) => {
    // Формат: 001_initial_schema.sql
    const match = file.match(/^(\d{3})_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Неверный формат файла миграции: ${file}`);
    }

    return {
      version: match[1],
      name: match[2],
      path: path.join(migrationsDir, file),
    };
  });
}

/**
 * Применить миграцию
 */
async function applyMigration(migration: { version: string; name: string; path: string }): Promise<void> {
  console.log(`📝 Применяю миграцию ${migration.version}: ${migration.name}...`);

  const sql = await fs.readFile(migration.path, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Выполняем SQL миграции
    await client.query(sql);

    // Записываем в таблицу миграций
    await client.query(
      'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
      [migration.version, migration.name]
    );

    await client.query('COMMIT');
    console.log(`✅ Миграция ${migration.version} применена успешно`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`❌ Ошибка при применении миграции ${migration.version}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Откатить последнюю миграцию
 */
async function rollbackLastMigration(): Promise<void> {
  const result = await pool.query<{ version: string; name: string }>(
    'SELECT version, name FROM schema_migrations ORDER BY applied_at DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    console.log('ℹ️ Нет миграций для отката');
    return;
  }

  const lastMigration = result.rows[0];
  console.log(`⏮️ Откат миграции ${lastMigration.version}: ${lastMigration.name}...`);

  // Ищем файл rollback (если есть)
  const rollbackPath = path.join(migrationsDir, `${lastMigration.version}_${lastMigration.name}_rollback.sql`);

  try {
    const rollbackSql = await fs.readFile(rollbackPath, 'utf-8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Выполняем SQL отката
      await client.query(rollbackSql);

      // Удаляем запись из таблицы миграций
      await client.query('DELETE FROM schema_migrations WHERE version = $1', [lastMigration.version]);

      await client.query('COMMIT');
      console.log(`✅ Миграция ${lastMigration.version} откачена успешно`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Ошибка при откате миграции:`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.error(`❌ Файл отката не найден: ${rollbackPath}`);
      console.log('ℹ️ Нужно вручную откатить миграцию или создать rollback файл');
    } else {
      throw error;
    }
  }
}

/**
 * Запустить все непримененные миграции
 */
async function migrateUp(): Promise<void> {
  console.log('🚀 Начинаю миграции...\n');

  await createMigrationsTable();

  const applied = await getAppliedMigrations();
  const migrations = await getMigrationFiles();

  const pending = migrations.filter((m) => !applied.has(m.version));

  if (pending.length === 0) {
    console.log('✅ Все миграции уже применены');
    return;
  }

  console.log(`📋 Найдено ${pending.length} новых миграций:\n`);

  for (const migration of pending) {
    await applyMigration(migration);
  }

  console.log('\n✅ Все миграции успешно применены!');
}

/**
 * Откатить последнюю миграцию
 */
async function migrateDown(): Promise<void> {
  console.log('⏮️ Откат последней миграции...\n');

  await rollbackLastMigration();

  console.log('\n✅ Откат завершен');
}

/**
 * Показать статус миграций
 */
async function migrateStatus(): Promise<void> {
  await createMigrationsTable();

  const applied = await getAppliedMigrations();
  const migrations = await getMigrationFiles();

  console.log('\n📊 Статус миграций:\n');
  console.log('─'.repeat(60));

  for (const migration of migrations) {
    const status = applied.has(migration.version) ? '✅ Применена' : '⏳ Ожидает';
    console.log(`${migration.version} | ${status.padEnd(15)} | ${migration.name}`);
  }

  console.log('─'.repeat(60));
  console.log(`\nВсего: ${migrations.length} | Применено: ${applied.size} | Ожидает: ${migrations.length - applied.size}\n`);
}

// CLI интерфейс
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'up':
        await migrateUp();
        break;
      case 'down':
        await migrateDown();
        break;
      case 'status':
        await migrateStatus();
        break;
      default:
        console.log(`
Использование:
  npm run migrate:up      - Применить все миграции
  npm run migrate:down    - Откатить последнюю миграцию
  npm run migrate:status  - Показать статус миграций
        `);
    }
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Запуск если вызван напрямую
if (require.main === module) {
  main();
}

export { migrateUp, migrateDown, migrateStatus };

export async function closeMigrationPool(): Promise<void> {
  await pool.end();
}
