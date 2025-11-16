import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ClanWaitlistController } from '../controllers/ClanWaitlistController';

const router = Router();
const waitlistController = new ClanWaitlistController();

router.post('/clan/waitlist', authenticate, waitlistController.submit);

export default router;
