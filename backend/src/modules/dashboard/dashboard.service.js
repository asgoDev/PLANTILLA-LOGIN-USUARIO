import AppError from '../../shared/errors/AppError.js';

class DashboardService {
    /**
     * @param {object} dependencies
     * @param {Record<string, { getStats: (userId: string) => Promise<any> }>} dependencies.providersByRole
     */
    constructor({ providersByRole }) {
        this.providersByRole = providersByRole;
    }

    /**
     * Obtiene las estadísticas del dashboard delegando al provider configurado para el rol.
     *
     * @param {string} role - Rol del usuario autenticado
     * @param {string} userId - ID del usuario autenticado
     * @returns {Promise<any>}
     */
    async getStats(role, userId) {
        const provider = this.providersByRole?.[role];
        if (!provider) {
            throw new AppError(
                `Dashboard no configurado para rol: ${role}`,
                404,
                'DASHBOARD_ROLE_NOT_CONFIGURED'
            );
        }

        return provider.getStats(userId);
    }
}

export default DashboardService;


