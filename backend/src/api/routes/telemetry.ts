import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { telemetryController } from '../controllers/TelemetryController';

const router = Router();

router.post('/client', authenticate, telemetryController.logClientEvent);

export default router;
