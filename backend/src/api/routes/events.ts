import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { PvpEventsController } from '../controllers/PvpEventsController';

const router = Router();
const pvpEventsController = new PvpEventsController();

router.get('/pvp', pvpEventsController.list);
router.post('/pvp/queue', authenticate, pvpEventsController.joinQueue);
router.post('/pvp/reminder', authenticate, pvpEventsController.scheduleReminder);

export default router;
