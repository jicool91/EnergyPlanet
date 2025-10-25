import { PoolClient } from 'pg';
import { runQuery } from './base';

export interface InventoryRecord {
  id: string;
  userId: string;
  buildingId: string;
  count: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InventoryRow {
  id: string;
  user_id: string;
  building_id: string;
  count: number;
  level: number;
  created_at: string;
  updated_at: string;
}

function mapInventory(row: InventoryRow): InventoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    buildingId: row.building_id,
    count: row.count,
    level: row.level,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listInventory(
  userId: string,
  client?: PoolClient
): Promise<InventoryRecord[]> {
  const result = await runQuery<InventoryRow>(
    `SELECT *
     FROM inventory
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId],
    client
  );

  return result.rows.map(mapInventory);
}

export async function getInventoryItem(
  userId: string,
  buildingId: string,
  client?: PoolClient
): Promise<InventoryRecord | null> {
  const result = await runQuery<InventoryRow>(
    `SELECT *
     FROM inventory
     WHERE user_id = $1 AND building_id = $2`,
    [userId, buildingId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapInventory(result.rows[0]);
}

export async function upsertInventoryItem(
  userId: string,
  buildingId: string,
  countDelta: number,
  levelDelta: number,
  client?: PoolClient
): Promise<InventoryRecord> {
  const result = await runQuery<InventoryRow>(
    `INSERT INTO inventory (user_id, building_id, count, level)
     VALUES ($1, $2, GREATEST($3, 0), GREATEST($4, 0))
     ON CONFLICT (user_id, building_id)
     DO UPDATE SET
       count = GREATEST(inventory.count + $3, 0),
       level = GREATEST(inventory.level + $4, 0),
       updated_at = NOW()
     RETURNING *`,
    [userId, buildingId, countDelta, levelDelta],
    client
  );

  return mapInventory(result.rows[0]);
}

export async function resetInventory(
  userId: string,
  client?: PoolClient
): Promise<void> {
  await runQuery(
    `DELETE FROM inventory WHERE user_id = $1`,
    [userId],
    client
  );
}
