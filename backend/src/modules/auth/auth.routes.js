import { Router } from 'express';
import authController from './auth.controller.js';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authLimiter } from '../../shared/middleware/security.middleware.js';
import validate from '../../shared/middleware/validate.js';
import { loginSchema } from './auth.validation.js';

const router = Router();

// validate(loginSchema) valida req.body antes de llegar al controlador.
// Si falla, lanza ZodError directamente al errorHandler — el servicio nunca lo ve.
router.post('/login',   authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout',  authController.logout);
router.get('/me',       authenticate, authController.getMe);

export default router;
