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
  provider: string;
  currency: string;
  amount_minor: string | null;
  provider_order_id: string | null;
  payment_url: string | null;
  sbp_qr_id: string | null;
  sbp_payload: string | null;
  expires_at: string | null;
  status_reason: string | null;
  metadata: unknown;
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
  provider: string;
  currency: string;
  amountMinor: number | null;
  providerOrderId: string | null;
  paymentUrl: string | null;
  sbpQrId: string | null;
  sbpPayload: string | null;
  expiresAt: Date | null;
  statusReason: string | null;
  metadata: Record<string, unknown>;
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
    provider: row.provider,
    currency: row.currency,
    amountMinor: row.amount_minor !== null ? Number(row.amount_minor) : null,
    providerOrderId: row.provider_order_id,
    paymentUrl: row.payment_url,
    sbpQrId: row.sbp_qr_id,
    sbpPayload: row.sbp_payload,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    statusReason: row.status_reason,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
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

export async function findByProviderOrderId(
  provider: string,
  providerOrderId: string,
  client?: PoolClient
): Promise<PurchaseRecord | null> {
  const result = await runQuery<PurchaseRow>(
    `SELECT *
     FROM purchases
     WHERE provider = $1
       AND provider_order_id = $2`,
    [provider, providerOrderId],
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
    provider?: string;
    currency?: string;
    amountMinor?: number | null;
    providerOrderId?: string | null;
    paymentUrl?: string | null;
    sbpQrId?: string | null;
    sbpPayload?: string | null;
    expiresAt?: Date | null;
    statusReason?: string | null;
    metadata?: Record<string, unknown> | null;
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
        status,
        provider,
        currency,
        amount_minor,
        provider_order_id,
        payment_url,
        sbp_qr_id,
        sbp_payload,
        expires_at,
        status_reason,
        metadata
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
      options?.provider ?? 'mock',
      options?.currency ?? 'STARS',
      options?.amountMinor ?? null,
      options?.providerOrderId ?? null,
      options?.paymentUrl ?? null,
      options?.sbpQrId ?? null,
      options?.sbpPayload ?? null,
      options?.expiresAt ?? null,
      options?.statusReason ?? null,
      options?.metadata ?? {},
    ],
    options?.client
  );

  return mapPurchase(result.rows[0]);
}

export async function updatePurchase(
  purchaseId: string,
  updates: {
    status?: string;
    providerOrderId?: string | null;
    paymentUrl?: string | null;
    sbpQrId?: string | null;
    sbpPayload?: string | null;
    expiresAt?: Date | null;
    statusReason?: string | null;
    metadata?: Record<string, unknown> | null;
    amountMinor?: number | null;
    currency?: string;
    provider?: string;
  },
  client?: PoolClient
): Promise<PurchaseRecord> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(updates.status);
  }
  if (updates.providerOrderId !== undefined) {
    fields.push(`provider_order_id = $${fields.length + 1}`);
    values.push(updates.providerOrderId);
  }
  if (updates.paymentUrl !== undefined) {
    fields.push(`payment_url = $${fields.length + 1}`);
    values.push(updates.paymentUrl);
  }
  if (updates.sbpQrId !== undefined) {
    fields.push(`sbp_qr_id = $${fields.length + 1}`);
    values.push(updates.sbpQrId);
  }
  if (updates.sbpPayload !== undefined) {
    fields.push(`sbp_payload = $${fields.length + 1}`);
    values.push(updates.sbpPayload);
  }
  if (updates.expiresAt !== undefined) {
    fields.push(`expires_at = $${fields.length + 1}`);
    values.push(updates.expiresAt);
  }
  if (updates.statusReason !== undefined) {
    fields.push(`status_reason = $${fields.length + 1}`);
    values.push(updates.statusReason);
  }
  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${fields.length + 1}`);
    values.push(updates.metadata ?? {});
  }
  if (updates.amountMinor !== undefined) {
    fields.push(`amount_minor = $${fields.length + 1}`);
    values.push(updates.amountMinor);
  }
  if (updates.currency !== undefined) {
    fields.push(`currency = $${fields.length + 1}`);
    values.push(updates.currency);
  }
  if (updates.provider !== undefined) {
    fields.push(`provider = $${fields.length + 1}`);
    values.push(updates.provider);
  }

  if (fields.length === 0) {
    const existing = await findByPurchaseId(purchaseId, client);
    if (!existing) {
      throw new Error(`purchase ${purchaseId} not found`);
    }
    return existing;
  }

  values.push(purchaseId);

  const result = await runQuery<PurchaseRow>(
    `UPDATE purchases
     SET ${fields.join(', ')},
         updated_at = NOW()
     WHERE purchase_id = $${values.length}
     RETURNING *`,
    values,
    client
  );

  if (result.rowCount === 0) {
    throw new Error(`purchase ${purchaseId} not found`);
  }

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
