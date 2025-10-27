import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { questController } from '../controllers/QuestController';

const router = Router();

router.get('/quests', authenticate, questController.list);
router.post('/quests/:questId/claim', authenticate, questController.claim);

export default router;
