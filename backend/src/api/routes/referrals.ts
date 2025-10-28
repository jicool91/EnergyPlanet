import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { referralController } from '../controllers/ReferralController';

const router = Router();

router.get('/referrals', authenticate, referralController.summary);
router.post('/referrals/activate', authenticate, referralController.activate);
router.post(
  '/referrals/milestones/:milestoneId/claim',
  authenticate,
  referralController.claimMilestone
);

export default router;
