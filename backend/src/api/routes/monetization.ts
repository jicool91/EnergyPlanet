import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { CosmeticController } from '../controllers/CosmeticController';
import { BoostController } from '../controllers/BoostController';
import { PurchaseController } from '../controllers/PurchaseController';
import { PaymentWebhookController } from '../controllers/PaymentWebhookController';
import { purchaseRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
const cosmeticController = new CosmeticController();
const boostController = new BoostController();
const purchaseController = new PurchaseController();
const paymentWebhookController = new PaymentWebhookController();

router.get('/cosmetics', authenticate, cosmeticController.list);
router.post('/cosmetics/purchase', authenticate, purchaseRateLimiter, cosmeticController.purchase);
router.post('/purchase/invoice', authenticate, purchaseController.invoice);
router.post('/purchase', authenticate, purchaseRateLimiter, purchaseController.create);
router.post('/purchase/webhook', paymentWebhookController.handle);
router.get('/purchase/packs', authenticate, purchaseController.packs);
router.post('/purchase/create', authenticate, purchaseRateLimiter, purchaseController.start);
router.get('/purchase/:purchaseId', authenticate, purchaseController.status);
router.post('/purchase/:purchaseId/cancel', authenticate, purchaseRateLimiter, purchaseController.cancel);
router.post('/cosmetics/equip', authenticate, cosmeticController.equip);

router.get('/boost', authenticate, boostController.list);
router.post('/boost/claim', authenticate, boostController.claim);

export default router;
