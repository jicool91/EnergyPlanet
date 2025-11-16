import { PoolClient } from 'pg';
import { runQuery } from './base';

interface PurchaseEventRow {
  id: string;
  purchase_id: string;
  provider: string;
  provider_status: string;
  payload: unknown;
  created_at: string;
}

export interface PurchaseEventRecord {
  id: string;
  purchaseId: string;
  provider: string;
  providerStatus: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

function mapEvent(row: PurchaseEventRow): PurchaseEventRecord {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    provider: row.provider,
    providerStatus: row.provider_status,
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at),
  };
}

export async function insertPurchaseEvent(
  input: {
    purchaseId: string;
    provider: string;
    providerStatus: string;
    payload?: Record<string, unknown> | null;
  },
  client?: PoolClient
): Promise<PurchaseEventRecord> {
  const result = await runQuery<PurchaseEventRow>(
    `INSERT INTO purchase_events (
        purchase_id,
        provider,
        provider_status,
        payload
     ) VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.purchaseId, input.provider, input.providerStatus, input.payload ?? {}],
    client
  );

  return mapEvent(result.rows[0]);
}

