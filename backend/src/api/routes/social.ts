import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { SocialController } from '../controllers/SocialController';

const router = Router();
const controller = new SocialController();

router.get('/leaderboard', authenticate, controller.leaderboard);
router.get('/profile/:userId', authenticate, controller.profile);

export default router;
