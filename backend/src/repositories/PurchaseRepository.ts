import { PoolClient } from 'pg';
import { runQuery } from './base';

interface PurchaseRow {
  id: string;
  purchase_id: string;
  user_id: string;
  purchase_type: string;
  item_id: string;
  price_stars: number | null;
  telegram_payment_id: string | null;
  ad_token: string | null;
  status: string;
  created_at: string;
}

export interface PurchaseRecord {
  id: string;
  purchaseId: string;
  userId: string;
  purchaseType: string;
  itemId: string;
  priceStars: number | null;
  telegramPaymentId: string | null;
  adToken: string | null;
  status: string;
  createdAt: Date;
}

function mapPurchase(row: PurchaseRow): PurchaseRecord {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    userId: row.user_id,
    purchaseType: row.purchase_type,
    itemId: row.item_id,
    priceStars: row.price_stars ?? null,
    telegramPaymentId: row.telegram_payment_id,
    adToken: row.ad_token,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export async function findByPurchaseId(
  purchaseId: string,
  client?: PoolClient
): Promise<PurchaseRecord | null> {
  const result = await runQuery<PurchaseRow>(
    `SELECT *
     FROM purchases
     WHERE purchase_id = $1`,
    [purchaseId],
    client
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapPurchase(result.rows[0]);
}

export async function createPurchase(
  purchaseId: string,
  userId: string,
  purchaseType: string,
  itemId: string,
  priceStars: number | null,
  status: string,
  options?: {
    telegramPaymentId?: string | null;
    adToken?: string | null;
    client?: PoolClient;
  }
): Promise<PurchaseRecord> {
  const result = await runQuery<PurchaseRow>(
    `INSERT INTO purchases (
        purchase_id,
        user_id,
        purchase_type,
        item_id,
        price_stars,
        telegram_payment_id,
        ad_token,
        status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      purchaseId,
      userId,
      purchaseType,
      itemId,
      priceStars,
      options?.telegramPaymentId ?? null,
      options?.adToken ?? null,
      status,
    ],
    options?.client
  );

  return mapPurchase(result.rows[0]);
}

export async function updatePurchaseStatus(
  purchaseId: string,
  status: string,
  client?: PoolClient
): Promise<PurchaseRecord> {
  const result = await runQuery<PurchaseRow>(
    `UPDATE purchases
     SET status = $2
     WHERE purchase_id = $1
     RETURNING *`,
    [purchaseId, status],
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`purchase ${purchaseId} not found`);
  }

  return mapPurchase(result.rows[0]);
}
