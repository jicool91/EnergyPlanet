/**
 * Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authRateLimiter } from '../../middleware/rateLimiter';

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/telegram - Authenticate with Telegram
router.post('/telegram', authRateLimiter, authController.authenticateWithTelegram);

// POST /api/v1/auth/tma - Authenticate using Telegram Mini App Authorization header
router.post('/tma', authRateLimiter, authController.authenticateWithTelegramHeader);

// POST /api/v1/auth/refresh - Refresh access token
router.post('/refresh', authRateLimiter, authController.refreshToken);

export default router;
