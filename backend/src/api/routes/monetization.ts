import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { CosmeticController } from '../controllers/CosmeticController';
import { BoostController } from '../controllers/BoostController';

const router = Router();
const cosmeticController = new CosmeticController();
const boostController = new BoostController();

router.get('/cosmetics', authenticate, cosmeticController.list);
router.post('/cosmetics/purchase', authenticate, cosmeticController.purchase);
router.post('/cosmetics/equip', authenticate, cosmeticController.equip);

// TODO: Implement boost claims
router.post('/boost/claim', authenticate, boostController.claim);

export default router;
