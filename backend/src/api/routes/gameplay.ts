import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { GameplayController } from '../controllers/GameplayController';
import { tapRateLimiter, upgradeRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
const controller = new GameplayController();

router.post('/tap', authenticate, tapRateLimiter, controller.tap);
router.post('/tick', authenticate, controller.tick);
router.post('/upgrade', authenticate, upgradeRateLimiter, controller.upgrade);

export default router;
