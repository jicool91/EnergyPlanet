import { Router } from 'express';
import { telemetryController } from '../controllers/TelemetryController';
import { authenticateOptional } from '../../middleware/auth';

const router = Router();

// Public endpoint for client logging (errors during auth can't authenticate themselves!)
router.post('/client', authenticateOptional, telemetryController.logClientEvent);

export default router;
