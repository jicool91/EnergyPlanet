import { Request, Response, NextFunction } from 'express';
import { getPaymentProvider } from '../../services/payments';
import { purchaseService } from '../../services/PurchaseService';

const resolveProviderName = (req: Request): string | undefined => {
  if (typeof req.query.provider === 'string') {
    return req.query.provider;
  }
  const body = req.body;
  if (body && typeof body === 'object' && typeof (body as Record<string, unknown>).provider === 'string') {
    return (body as Record<string, unknown>).provider as string;
  }
  return undefined;
};

export class PaymentWebhookController {
  handle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = getPaymentProvider(resolveProviderName(req));
      if (!provider.parseWebhook) {
        res.status(202).json({ success: true, message: 'webhook_unsupported' });
        return;
      }

      const update = await provider.parseWebhook(req.body, req.headers);
      if (!update) {
        res.status(202).json({ success: true, message: 'webhook_skipped' });
        return;
      }

      await purchaseService.handleProviderUpdate(provider.name, update);
      res.status(202).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}

