/**
 * Authentication Routes
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/telegram - Authenticate with Telegram
router.post('/telegram', authController.authenticateWithTelegram);

// POST /api/v1/auth/refresh - Refresh access token
router.post('/refresh', authController.refreshToken);

export default router;
