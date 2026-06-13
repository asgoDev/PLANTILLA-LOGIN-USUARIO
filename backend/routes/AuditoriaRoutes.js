import { Router } from 'express';
import auditoriaController from '../controllers/AuditoriaController.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Solo admins autenticados pueden consultar los logs
router.use(authenticate);
router.use(authorize('admin'));
router.get('/', auditoriaController.getLogs);

export default router;