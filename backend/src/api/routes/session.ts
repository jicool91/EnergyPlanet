import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { SessionController } from '../controllers/SessionController';

const router = Router();
const controller = new SessionController();

router.post('/', authenticate, controller.openSession);
router.post('/logout', authenticate, controller.logout);

export default router;
