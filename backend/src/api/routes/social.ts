import { Router } from 'express';

const router = Router();

// TODO: Implement social routes
router.get('/leaderboard', (req, res) => {
  res.json({ message: 'Leaderboard endpoint - TODO' });
});

router.get('/profile/:userId', (req, res) => {
  res.json({ message: 'Profile endpoint - TODO' });
});

export default router;
