import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';

const router = Router();
const adminController = new AdminController();

router.get('/migrations/status', adminController.getMigrationStatus);
router.get('/health/full', adminController.getFullHealth);

router.patch('/flags', (_req, res) => {
  res.json({ message: 'Update flags endpoint - TODO' });
});

export default router;
