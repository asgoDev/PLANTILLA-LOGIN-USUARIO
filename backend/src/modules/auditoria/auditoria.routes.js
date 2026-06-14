import { Router } from 'express';
import auditoriaController from './auditoria.controller.js';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware.js';

const router = Router();

// Solo admins autenticados pueden consultar los logs
router.use(authenticate);
router.use(authorize('admin'));
router.get('/', auditoriaController.getLogs);

export default router;
