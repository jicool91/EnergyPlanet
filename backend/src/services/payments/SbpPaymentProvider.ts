import crypto from 'crypto';
import { config } from '../../config';
import type {
  CreateChargeInput,
  CreateChargeResult,
  PaymentProvider,
  ProviderStatus,
  ProviderStatusUpdate,
} from './PaymentProvider';

type SbpWebhookBody = {
  order_id?: unknown;
  status?: unknown;
  payload?: unknown;
  payment_url?: unknown;
};

const STATUS_MAP: Record<string, ProviderStatus> = {
  pending: 'pending',
  paid: 'paid',
  failed: 'failed',
  expired: 'failed',
};

export class SbpPaymentProvider implements PaymentProvider {
  name = 'sbp';

  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    const ttlMinutes = Math.max(config.payment.qrTtlMinutes, 1);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const providerOrderId = `sbp_${input.purchaseId}`;

    const payUrl =
      config.payment.sbp.apiBaseUrl && config.payment.sbp.merchantId
        ? `${config.payment.sbp.apiBaseUrl}/pay/${providerOrderId}`
        : `${config.payment.mockPayUrl}?payload=${encodeURIComponent(providerOrderId)}`;

    const qrPayload = `SBP:${providerOrderId}`;

    return {
      providerOrderId,
      paymentUrl: payUrl,
      qrPayload,
      expiresAt,
      status: 'pending',
      metadata: {
        amount_minor: input.amountMinor,
        currency: input.currency,
        description: input.description,
      },
    };
  }

  async pollStatus(): Promise<ProviderStatusUpdate | null> {
    return null;
  }

  async parseWebhook(
    body: unknown,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ProviderStatusUpdate | null> {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const payload = body as SbpWebhookBody;
    const orderId = typeof payload.order_id === 'string' ? payload.order_id : null;
    const statusRaw = typeof payload.status === 'string' ? payload.status.toLowerCase() : null;
    const mappedStatus = statusRaw ? STATUS_MAP[statusRaw] : undefined;
    if (!orderId || !mappedStatus) {
      return null;
    }

    if (config.payment.sbp.webhookSecret) {
      const signatureHeader = headers['x-sbp-signature'];
      const providedSignature = Array.isArray(signatureHeader)
        ? signatureHeader[0]
        : signatureHeader;
      if (providedSignature) {
        const serialized = JSON.stringify(body);
        const computed = crypto
          .createHmac('sha256', config.payment.sbp.webhookSecret)
          .update(serialized)
          .digest('hex');
        if (!timingSafeEqual(providedSignature, computed)) {
          return null;
        }
      }
    }

    return {
      providerOrderId: orderId,
      status: mappedStatus,
      paymentUrl: typeof payload.payment_url === 'string' ? payload.payment_url : undefined,
      payload: typeof payload.payload === 'object' && payload.payload !== null ? (payload.payload as Record<string, unknown>) : {},
    };
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export const sbpPaymentProvider = new SbpPaymentProvider();

