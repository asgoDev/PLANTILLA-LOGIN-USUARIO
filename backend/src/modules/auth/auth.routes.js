import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { authLimiter } from '../../shared/middleware/security.middleware.js';
import validate from '../../shared/middleware/validate.js';
import { loginSchema } from './auth.validation.js';

const createAuthRoutes = (authController) => {
  const router = Router();

  // validate(loginSchema) valida req.body antes de llegar al controlador.
  // Si falla, lanza ZodError directamente al errorHandler — el servicio nunca lo ve.
  router.post('/login',   authLimiter, validate(loginSchema), (req, res, next) => authController.login(req, res, next));
  router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
  router.post('/logout',  (req, res, next) => authController.logout(req, res, next));
  router.get('/me',       authenticate, (req, res, next) => authController.getMe(req, res, next));

  return router;
};

export default createAuthRoutes;
