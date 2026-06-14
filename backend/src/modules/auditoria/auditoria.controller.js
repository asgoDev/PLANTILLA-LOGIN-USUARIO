import auditoriaService from './auditoria.service.js';

class AuditoriaController {
    /**
     * GET /api/dashboard/auditoria
     *
     * Query params opcionales:
     *  page        número de página          (default 1)
     *  limit       registros por página      (default 50, máx 100)
     *  usuario_id  filtrar por usuario
     *  modulo      USERS | AUTH | DASHBOARD…
     *  accion      CREAR | ACTUALIZAR | ELIMINAR
     *  resultado   EXITOSO | FALLIDO
     *  desde       fecha ISO inicio del rango (2025-01-01)
     *  hasta       fecha ISO fin del rango    (2025-12-31)
     */
    async getLogs(req, res, next) {
        try {
            const { page, limit, usuario_id, modulo, accion, resultado, desde, hasta } = req.query;

            // Limitar el page size máximo para no saturar la respuesta
            const safeLimit = Math.min(Number(limit) || 50, 100);

            const data = await auditoriaService.getAll({
                page: Number(page) || 1,
                limit: safeLimit,
                usuario_id,
                modulo,
                accion,
                resultado,
                desde,
                hasta,
            });

            res.json(data);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuditoriaController();
