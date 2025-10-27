import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { AchievementsController } from '../controllers/AchievementsController';

const router = Router();
const controller = new AchievementsController();

router.get('/', authenticate, controller.list);
router.post('/:slug/claim', authenticate, controller.claim);

export default router;
