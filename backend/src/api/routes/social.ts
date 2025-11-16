import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { SocialController } from '../controllers/SocialController';

const router = Router();
const controller = new SocialController();

router.get('/leaderboard', authenticate, controller.leaderboard);
router.get('/profile/:userId', authenticate, controller.profile);
router.get('/friends', authenticate, controller.friends);
router.post('/friends/requests', authenticate, controller.sendFriendRequest);
router.post('/friends/requests/:userId/accept', authenticate, controller.acceptFriendRequest);
router.post('/friends/requests/:userId/reject', authenticate, controller.rejectFriendRequest);
router.delete('/friends/:userId', authenticate, controller.removeFriend);

export default router;
