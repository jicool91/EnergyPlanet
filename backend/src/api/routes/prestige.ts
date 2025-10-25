import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { PrestigeController } from '../controllers/PrestigeController';

const router = Router();
const controller = new PrestigeController();

router.get('/prestige', authenticate, controller.status);
router.post('/prestige', authenticate, controller.perform);

export default router;
