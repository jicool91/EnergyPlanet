import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { CosmeticController } from '../controllers/CosmeticController';
import { BoostController } from '../controllers/BoostController';
import { PurchaseController } from '../controllers/PurchaseController';

const router = Router();
const cosmeticController = new CosmeticController();
const boostController = new BoostController();
const purchaseController = new PurchaseController();

router.get('/cosmetics', authenticate, cosmeticController.list);
router.post('/cosmetics/purchase', authenticate, cosmeticController.purchase);
router.post('/purchase/invoice', authenticate, purchaseController.invoice);
router.post('/purchase', authenticate, purchaseController.create);
router.post('/cosmetics/equip', authenticate, cosmeticController.equip);

// TODO: Implement boost claims
router.post('/boost/claim', authenticate, boostController.claim);

export default router;
