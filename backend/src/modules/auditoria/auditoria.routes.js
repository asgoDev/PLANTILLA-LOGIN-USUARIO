import { Router } from 'express';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';

const createAuditoriaRoutes = (auditoriaController) => {
  const router = Router();

  // Solo admins autenticados pueden consultar los logs
  router.use(authenticate);
  router.use(authorize('admin'));
  router.get('/', (req, res, next) => auditoriaController.getLogs(req, res, next));

  return router;
};

export default createAuditoriaRoutes;
