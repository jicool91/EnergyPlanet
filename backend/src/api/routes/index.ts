/**
 * API Routes Index
 */

import { Router } from 'express';
import authRoutes from './auth';
import sessionRoutes from './session';
import gameplayRoutes from './gameplay';
import socialRoutes from './social';
import monetizationRoutes from './monetization';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/', gameplayRoutes); // /tap, /tick, /upgrade
router.use('/', socialRoutes); // /leaderboard, /profile
router.use('/', monetizationRoutes); // /cosmetics, /purchase, /boost
router.use('/admin', adminRoutes);

export default router;
