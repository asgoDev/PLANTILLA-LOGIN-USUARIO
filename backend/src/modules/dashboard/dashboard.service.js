import User from '../users/user.model.js';
import Auditoria from '../auditoria/auditoria.model.js';

class DashboardService {
    /**
     * Estadísticas básicas para la pantalla de bienvenida.
     */
    async getStats() {
        const [usersCount, activeUsersCount, auditCount] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ estado: 'activo' }),
            Auditoria.countDocuments(),
        ]);

        return {
            usersCount,
            activeUsersCount,
            auditCount,
        };
    }
}

export default new DashboardService();
