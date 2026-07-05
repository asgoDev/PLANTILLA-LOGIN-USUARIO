import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';

const createDashboardRoutes = (dashboardController) => {
  const router = Router();

  router.use(authenticate);
  router.use(authorize('admin'));
  router.get('/stats', (req, res, next) => dashboardController.getStats(req, res, next));

  return router;
};

export default createDashboardRoutes;
