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
import telemetryRoutes from './telemetry';
import contentRoutes from './content';
import prestigeRoutes from './prestige';
import achievementsRoutes from './achievements';
import questsRoutes from './quests';

const router = Router();

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/', gameplayRoutes); // /tap, /tick, /upgrade
router.use('/', prestigeRoutes); // /prestige
router.use('/', socialRoutes); // /leaderboard, /profile
router.use('/', monetizationRoutes); // /cosmetics, /purchase, /boost
router.use('/', questsRoutes); // /quests
router.use('/achievements', achievementsRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/', contentRoutes); // /buildings
router.use('/admin', adminRoutes);

export default router;
