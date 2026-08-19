import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';

const createDashboardRoutes = (dashboardController) => {
  const router = Router();

  router.use(authenticate);
  // Cualquier usuario autenticado puede acceder a su dashboard personalizado
  router.get('/stats', (req, res, next) => dashboardController.getStats(req, res, next));

  return router;
};

export default createDashboardRoutes;
