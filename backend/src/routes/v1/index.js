import { Router } from 'express';

/**
 * Sub-router de v1.
 * Agrupa todos los módulos bajo el prefijo /api/v1.
 *
 * Rutas expuestas:
 *   /api/v1/auth/...
 *   /api/v1/users/...
 *   /api/v1/dashboard/...
 *   /api/v1/auditoria/...
 */
const createV1Routes = ({ authRoutes, userRoutes, dashboardRoutes, auditoriaRoutes }) => {
    const router = Router();

    router.use('/auth',      authRoutes);
    router.use('/users',     userRoutes);
    router.use('/dashboard', dashboardRoutes);
    router.use('/auditoria', auditoriaRoutes);

    return router;
};

export default createV1Routes;
