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
import referralRoutes from './referrals';
import chatRoutes from './chat';
import seasonRoutes from './season';

const router = Router();

router.use('/auth', authRoutes);
router.use('/session', sessionRoutes);
router.use('/', gameplayRoutes); // /tap, /tick, /upgrade
router.use('/', prestigeRoutes); // /prestige
router.use('/', socialRoutes); // /leaderboard, /profile
router.use('/', monetizationRoutes); // /cosmetics, /purchase, /boost
router.use('/', questsRoutes); // /quests
router.use('/', referralRoutes); // /referrals
router.use('/achievements', achievementsRoutes);
router.use('/telemetry', telemetryRoutes);
router.use('/', contentRoutes); // /buildings
router.use('/admin', adminRoutes);
router.use('/chat', chatRoutes);
router.use('/season', seasonRoutes);

export default router;
