import { Router } from 'express';

const router = Router();

// TODO: Implement admin routes
router.get('/flags', (_req, res) => {
  res.json({ message: 'Get flags endpoint - TODO' });
});

router.patch('/flags', (_req, res) => {
  res.json({ message: 'Update flags endpoint - TODO' });
});

export default router;
