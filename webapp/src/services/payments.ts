import { apiClient } from './apiClient';

export type PurchaseType = 'stars_pack' | 'cosmetic' | 'boost' | 'unknown';

export interface CreatePurchasePayload {
  purchase_id: string;
  item_id: string;
  purchase_type: PurchaseType;
  amount_minor: number;
  currency?: string;
  provider?: string;
  price_stars?: number;
  metadata?: Record<string, unknown>;
  description?: string;
}

export interface ProviderPayload {
  payment_url?: string | null;
  qr_payload?: string | null;
  expires_at?: string | null;
}

export interface PurchaseSnapshot {
  purchase_id: string;
  status: string;
  status_reason?: string | null;
  item_id?: string | null;
  purchase_type?: PurchaseType;
  amount_minor?: number | null;
  currency?: string | null;
  provider?: string | null;
  created_at?: string;
  payment_url?: string | null;
  qr_payload?: string | null;
  expires_at?: string | null;
}

type CreatePurchaseResponse = {
  success: boolean;
  purchase: PurchaseSnapshot;
  provider_payload: ProviderPayload;
};

type PurchaseStatusResponse = {
  success: boolean;
  purchase: PurchaseSnapshot;
};

export async function createPurchase(
  payload: CreatePurchasePayload
): Promise<CreatePurchaseResponse> {
  const response = await apiClient.post<CreatePurchaseResponse>('/purchase/create', payload);
  return response.data;
}

export async function getPurchaseStatus(purchaseId: string): Promise<PurchaseSnapshot> {
  const response = await apiClient.get<PurchaseStatusResponse>(`/purchase/${purchaseId}`);
  return response.data.purchase;
}

export async function cancelPurchase(purchaseId: string): Promise<PurchaseSnapshot> {
  const response = await apiClient.post<PurchaseStatusResponse>(`/purchase/${purchaseId}/cancel`);
  return response.data.purchase;
}
