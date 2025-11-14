/**
 * Season Routes
 * API endpoints for season system
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { SeasonController } from '../controllers/SeasonController';

const router = Router();
const controller = new SeasonController();

// Public routes (no auth required)
router.get('/current', controller.getCurrent);
router.get('/leaderboard', controller.getLeaderboard);

// Protected routes (auth required)
router.get('/progress', authenticate, controller.getProgress);
router.post('/claim-leaderboard-reward', authenticate, controller.claimLeaderboardReward);
router.post('/events/:eventId/participate', authenticate, controller.participateInEvent);
router.post('/events/:eventId/claim-reward', authenticate, controller.claimEventReward);

export default router;
