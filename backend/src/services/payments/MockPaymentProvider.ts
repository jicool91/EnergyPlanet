import type {
  CreateChargeInput,
  CreateChargeResult,
  PaymentProvider,
  ProviderStatusUpdate,
} from './PaymentProvider';

export class MockPaymentProvider implements PaymentProvider {
  name = 'mock';

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    return {
      providerOrderId: input.purchaseId,
      paymentUrl: null,
      qrPayload: null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      status: 'paid',
      metadata: input.metadata ?? {},
    };
  }

  async pollStatus(providerOrderId: string): Promise<ProviderStatusUpdate> {
    return {
      providerOrderId,
      status: 'paid',
      payload: { source: 'mock_poll' },
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();

