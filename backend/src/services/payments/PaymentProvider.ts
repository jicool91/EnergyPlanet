export type ProviderStatus = 'pending' | 'paid' | 'failed';

export interface CreateChargeInput {
  purchaseId: string;
  userId: string;
  itemId: string;
  description?: string;
  amountMinor: number;
  currency: string;
  metadata?: Record<string, unknown>;
}

export interface CreateChargeResult {
  providerOrderId: string;
  paymentUrl?: string | null;
  qrPayload?: string | null;
  expiresAt?: Date | null;
  status?: ProviderStatus;
  metadata?: Record<string, unknown>;
}

export interface ProviderStatusUpdate {
  providerOrderId: string;
  status: ProviderStatus;
  statusReason?: string;
  paymentUrl?: string | null;
  qrPayload?: string | null;
  expiresAt?: Date | null;
  payload?: Record<string, unknown>;
}

export interface PaymentProvider {
  name: string;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
  pollStatus?(providerOrderId: string): Promise<ProviderStatusUpdate | null>;
  parseWebhook?(
    body: unknown,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ProviderStatusUpdate | null>;
}

