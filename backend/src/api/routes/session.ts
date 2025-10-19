import { Router } from 'express';

const router = Router();

// TODO: Implement session routes
router.post('/', (req, res) => {
  res.json({ message: 'Session endpoint - TODO' });
});

export default router;
