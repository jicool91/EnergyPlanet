import { Router } from 'express';

const router = Router();

// TODO: Implement monetization routes
router.get('/cosmetics', (req, res) => {
  res.json({ message: 'Cosmetics endpoint - TODO' });
});

router.post('/cosmetics/equip', (req, res) => {
  res.json({ message: 'Equip cosmetic endpoint - TODO' });
});

router.post('/purchase', (req, res) => {
  res.json({ message: 'Purchase endpoint - TODO' });
});

router.post('/boost/claim', (req, res) => {
  res.json({ message: 'Claim boost endpoint - TODO' });
});

export default router;
