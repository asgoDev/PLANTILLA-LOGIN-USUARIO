class DashboardService {
    constructor({ userRepository, auditoriaRepository }) {
        this.userRepo = userRepository;
        this.auditoriaRepo = auditoriaRepository;
    }

    /**
     * Estadísticas básicas para la pantalla de bienvenida.
     */
    async getStats() {
        const [usersCount, activeUsersCount, auditCount] = await Promise.all([
            this.userRepo.countDocuments(),
            this.userRepo.countDocuments({ estado: 'activo' }),
            this.auditoriaRepo.countDocuments(),
        ]);

        return {
            usersCount,
            activeUsersCount,
            auditCount,
        };
    }
}

export default DashboardService;
