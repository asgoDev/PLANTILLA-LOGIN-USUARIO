class DashboardService {
    constructor({ userRepository, auditoriaRepository }) {
        this.userRepo = userRepository;
        this.auditoriaRepo = auditoriaRepository;
    }

    /**
     * Estadísticas del dashboard según el usuario y su rol.
     * Consulta directamente MongoDB de forma ultrarrápida (countDocuments).
     *
     * @param {object} user - Usuario autenticado { id, role }
     */
    async getStats(user) {
        if (user?.role === 'admin') {
            // Métricas del sistema para administradores
            const [usersCount, activeUsersCount, auditCount] = await Promise.all([
                this.userRepo.countDocuments(),
                this.userRepo.countDocuments({ estado: 'activo' }),
                this.auditoriaRepo.countDocuments(),
            ]);

            return {
                role: 'admin',
                usersCount,
                activeUsersCount,
                auditCount,
            };
        }

        // Métricas personalizadas para usuarios normales / roles SaaS
        // 💡 Extensible para el SaaS en el que se trabaje
        return {
            role: user?.role || 'user',
            userId: user?.id,
            metrics: {
                status: 'activo',
            },
        };
    }
}

export default DashboardService;

