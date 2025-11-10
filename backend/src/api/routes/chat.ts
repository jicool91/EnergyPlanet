import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ChatController } from '../controllers/ChatController';

const router = Router();
const controller = new ChatController();

router.get('/global/messages', authenticate, controller.getGlobalMessages);
router.post('/global/messages', authenticate, controller.postGlobalMessage);

export default router;
