import { config } from '../../config';
import type { PaymentProvider } from './PaymentProvider';
import { mockPaymentProvider } from './MockPaymentProvider';
import { sbpPaymentProvider } from './SbpPaymentProvider';

const registry: Record<string, PaymentProvider> = {
  mock: mockPaymentProvider,
  sbp: sbpPaymentProvider,
};

export function getPaymentProvider(provider?: string): PaymentProvider {
  const key = provider ?? config.payment.provider ?? 'mock';
  return registry[key] ?? mockPaymentProvider;
}

