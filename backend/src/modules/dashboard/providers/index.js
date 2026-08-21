import AdminDashboardProvider from './admin.dashboard-provider.js';

/**
 * Factory para instanciar todos los providers de dashboard registrados por rol.
 *
 * @param {object} dependencies
 * @param {import('../../users/user.repository.js').default} dependencies.userRepository
 * @param {import('../../auditoria/auditoria.repository.js').default} dependencies.auditoriaRepository
 * @returns {Record<string, { getStats: (userId: string) => Promise<any> }>}
 */
export default function createDashboardProviders({ userRepository, auditoriaRepository }) {
  return {
    admin: new AdminDashboardProvider({ userRepository, auditoriaRepository }),
    // Futuros roles:
    // barbero: new BarberoDashboardProvider({ ... }),
  };
}
