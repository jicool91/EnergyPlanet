import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { GameplayController } from '../controllers/GameplayController';

const router = Router();
const controller = new GameplayController();

router.post('/tap', authenticate, controller.tap);
router.post('/tick', authenticate, controller.tick);
router.post('/upgrade', authenticate, controller.upgrade);

export default router;
