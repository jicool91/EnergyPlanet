import { Router } from 'express';

const router = Router();

// TODO: Implement admin routes
router.get('/flags', (req, res) => {
  res.json({ message: 'Get flags endpoint - TODO' });
});

router.patch('/flags', (req, res) => {
  res.json({ message: 'Update flags endpoint - TODO' });
});

export default router;
