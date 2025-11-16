import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { ConstructionController } from '../controllers/ConstructionController';

const router = Router();
const controller = new ConstructionController();

router.get('/construction', authenticate, controller.listSnapshot);
router.post('/construction', authenticate, controller.startJob);
router.post('/construction/:jobId/complete', authenticate, controller.completeJob);
router.get('/builders', authenticate, controller.listBuilders);
router.post('/builders/activate', authenticate, controller.activateBuilder);

export default router;
