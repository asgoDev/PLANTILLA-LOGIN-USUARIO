import { toAdminDashboardDTO } from '../../../shared/dtos/dashboard/admin.dashboard.dto.js';

/**
 * Provider de estadísticas para el rol Admin.
 * Encapsula qué colecciones/fuentes y qué queries se ejecutan para este rol.
 */
class AdminDashboardProvider {
  /**
   * @param {object} dependencies
   * @param {import('../../users/user.repository.js').default} dependencies.userRepository
   * @param {import('../../auditoria/auditoria.repository.js').default} dependencies.auditoriaRepository
   */
  constructor({ userRepository, auditoriaRepository }) {
    this.userRepository = userRepository;
    this.auditoriaRepository = auditoriaRepository;
  }

  /**
   * Obtiene las métricas correspondientes al rol Admin.
   *
   * @param {string} userId - ID del usuario solicitante (cumple contrato uniforme)
   * @returns {Promise<ReturnType<typeof toAdminDashboardDTO>>}
   */
  async getStats(userId) {
    const [usersCount, activeUsersCount, inactiveUsersCount, auditCount] = await Promise.all([
      this.userRepository.countDocuments(),
      this.userRepository.countDocuments({ estado: 'activo' }),
      this.userRepository.countDocuments({ estado: 'inactivo' }),
      this.auditoriaRepository.countDocuments(),
    ]);

    return toAdminDashboardDTO({
      usersCount,
      activeUsersCount,
      inactiveUsersCount,
      auditCount,
    });
  }
}

export default AdminDashboardProvider;
