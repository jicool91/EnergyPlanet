import { Router } from 'express';
import { telemetryController } from '../controllers/TelemetryController';
import { authenticateOptional } from '../../middleware/auth';
import { telemetryRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Public endpoint for client logging (errors during auth can't authenticate themselves!)
// Rate limited to prevent telemetry spam (20 req/10sec per user)
router.post('/client', telemetryRateLimiter, authenticateOptional, telemetryController.logClientEvent);

export default router;
