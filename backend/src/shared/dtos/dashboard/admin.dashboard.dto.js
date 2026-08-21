/**
 * admin.dashboard.dto.js
 *
 * Mapeo de datos para las estadísticas del dashboard del rol Admin.
 * Sin condicionales de rol: transforma exclusivamente los datos procesados por el AdminDashboardProvider.
 */

/**
 * Mapea las estadísticas para el dashboard de Administrador.
 *
 * @param {object} data
 * @param {number} data.usersCount
 * @param {number} data.activeUsersCount
 * @param {number} data.inactiveUsersCount
 * @param {number} data.auditCount
 * @returns {{ usersCount: number, activeUsersCount: number, inactiveUsersCount: number, auditCount: number }}
 */
export function toAdminDashboardDTO(data) {
  return {
    usersCount: data.usersCount ?? 0,
    activeUsersCount: data.activeUsersCount ?? 0,
    inactiveUsersCount: data.inactiveUsersCount ?? 0,
    auditCount: data.auditCount ?? 0,
  };
}
