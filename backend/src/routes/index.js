import { Router } from 'express';
import createV1Routes from './v1/index.js';

/**
 * Router padre de la API.
 * Centraliza el montaje de todas las versiones.
 * Recibe las rutas ya instanciadas desde container.js.
 *
 * Enfoque híbrido:
 *   /api/health        → health check operacional (sin versionar)
 *   /api/v1/...        → rutas explícitas de v1
 *   /api/auth/...      → alias "latest" (apunta a v1, misma instancia en memoria)
 *   /api/v2/...        → (futuro)
 *
 * El frontend puede usar las rutas sin versión (/api/auth/login).
 * Para cambiar la versión activa, solo se modifica el alias aquí.
 */
const createApiRouter = ({ authRoutes, userRoutes, dashboardRoutes, auditoriaRoutes }) => {
    const router = Router();

    // ── Health check (operacional, fuera del contrato versionado) ──
    router.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
        });
    });

    // ── Versiones explícitas ──
    const v1Router = createV1Routes({ authRoutes, userRoutes, dashboardRoutes, auditoriaRoutes });
    router.use('/v1', v1Router);

    // ── Alias "latest" (misma instancia, cero overhead) ──
    router.use('/', v1Router);

    // ── v2 (futuro) ──
    // router.use('/v2', createV2Routes({ ... }));

    return router;
};

export default createApiRouter;
