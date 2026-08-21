import { Router } from 'express';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { passwordChangeLimiter } from '../../shared/middleware/security.middleware.js';
import validate from '../../shared/middleware/validate.js';
import { updateProfileSchema, updatePhotoSchema, changePasswordSchema } from './profile.validation.js';

const createProfileRoutes = (profileController) => {
  const router = Router();

  router.use(authenticate);

  router.get('/', (req, res, next) => profileController.getProfile(req, res, next));
  router.put('/', validate(updateProfileSchema), (req, res, next) =>
    profileController.updateProfile(req, res, next)
  );
  router.put('/photo', validate(updatePhotoSchema), (req, res, next) =>
    profileController.updatePhoto(req, res, next)
  );
  // Ruta de cambio de contraseña — rate limiter estricto + validación Zod
  router.put('/password', passwordChangeLimiter, validate(changePasswordSchema), (req, res, next) =>
    profileController.changePassword(req, res, next)
  );

  return router;
};

export default createProfileRoutes;
