import { Router } from 'express';

const router = Router();

// TODO: Implement gameplay routes
router.post('/tap', (req, res) => {
  res.json({ message: 'Tap endpoint - TODO' });
});

router.post('/tick', (req, res) => {
  res.json({ message: 'Tick endpoint - TODO' });
});

router.post('/upgrade', (req, res) => {
  res.json({ message: 'Upgrade endpoint - TODO' });
});

export default router;
