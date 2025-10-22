import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { buildingController } from '../controllers/BuildingController';

const router = Router();

router.get('/buildings', authenticate, buildingController.list);

export default router;
