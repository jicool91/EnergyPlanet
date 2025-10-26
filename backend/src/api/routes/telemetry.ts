import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { telemetryController } from '../controllers/TelemetryController';

const router = Router();

// Public endpoint for client logging (errors during auth can't authenticate themselves!)
router.post('/client', telemetryController.logClientEvent);

export default router;
