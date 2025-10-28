import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticate, requireAdmin } from '../../middleware/auth';

const router = Router();
const adminController = new AdminController();

router.use(authenticate, requireAdmin);

router.get('/migrations/status', adminController.getMigrationStatus);
router.get('/health/full', adminController.getFullHealth);
router.get('/monetization/metrics', adminController.getMonetizationMetrics);

router.patch('/flags', (_req, res) => {
  res.json({ message: 'Update flags endpoint - TODO' });
});

export default router;
