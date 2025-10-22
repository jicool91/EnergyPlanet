import { apiClient } from './apiClient';

export interface CosmeticUnlockRequirement {
  level?: number;
  price_stars?: number;
  [key: string]: unknown;
}

export interface CosmeticItem {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  unlock_type: 'free' | 'level' | 'purchase' | 'event';
  unlock_requirement: CosmeticUnlockRequirement;
  asset_url?: string;
  preview_url?: string;
  owned: boolean;
  equipped: boolean;
  status: 'owned' | 'locked' | 'purchase_required' | 'event_locked';
  price_stars?: number | null;
}

interface InvoiceResponse {
  success: true;
  invoice: {
    purchase_id: string;
    status: string;
    pay_url: string;
  };
}

interface PurchaseResponse {
  success: true;
  purchase: {
    purchase_id: string;
    status: string;
  };
}

export async function fetchCosmetics(): Promise<CosmeticItem[]> {
  const response = await apiClient.get<{ cosmetics: CosmeticItem[] }>('/cosmetics');
  return response.data.cosmetics ?? [];
}

function generatePurchaseId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `purchase_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function completeCosmeticPurchase(
  cosmetic: CosmeticItem,
  options: { metadata?: Record<string, unknown> } = {}
): Promise<{ purchaseId: string }> {
  if (!cosmetic.price_stars || cosmetic.price_stars <= 0) {
    throw new Error('Cosmetic is not purchasable with Stars');
  }

  const purchaseId = generatePurchaseId();

  const invoicePayload = {
    purchase_id: purchaseId,
    item_id: cosmetic.id,
    price_stars: cosmetic.price_stars,
    purchase_type: 'cosmetic',
    metadata: options.metadata ?? {},
  };

  const invoiceResponse = await apiClient.post<InvoiceResponse>('/purchase/invoice', invoicePayload);

  const telegram = typeof window !== 'undefined' ? window.Telegram : undefined;
  const hasTelegramInvoice =
    telegram?.WebApp && typeof telegram.WebApp.openInvoice === 'function';

  if (hasTelegramInvoice && invoiceResponse.data.invoice?.pay_url) {
    try {
      await telegram!.WebApp.openInvoice(invoiceResponse.data.invoice.purchase_id, () => {
        /* no-op callback for compatibility */
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('openInvoice failed, falling back to mock completion', error);
    }
  }

  await apiClient.post<PurchaseResponse>('/purchase', invoicePayload);

  return { purchaseId };
}

export async function unlockCosmetic(cosmeticId: string): Promise<void> {
  await apiClient.post('/cosmetics/purchase', { cosmetic_id: cosmeticId });
}

export async function equipCosmetic(cosmeticId: string): Promise<void> {
  await apiClient.post('/cosmetics/equip', { cosmetic_id: cosmeticId });
}
