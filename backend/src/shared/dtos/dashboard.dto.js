/**
 * dashboard.dto.js
 *
 * Funciones de mapeo para las estadísticas del dashboard.
 * Actualmente es un wrapper directo; a futuro puede enriquecer
 * los datos (ej: calcular porcentajes, formatear fechas, etc.).
 */

/**
 * DTO de estadísticas del dashboard.
 *
 * @param {object} stats
 * @param {number} stats.usersCount
 * @param {number} stats.activeUsersCount
 * @param {number} stats.auditCount
 * @returns {object}
 */
export function toDashboardStatsDTO(stats) {
  if (stats.role === 'admin' || stats.usersCount !== undefined) {
    const usersCount = stats.usersCount ?? 0;
    const activeUsersCount = stats.activeUsersCount ?? 0;
    return {
      role: stats.role || 'admin',
      usersCount,
      activeUsersCount,
      inactiveUsersCount: usersCount - activeUsersCount,
      auditCount: stats.auditCount ?? 0,
    };
  }

  return {
    role: stats.role || 'user',
    userId: stats.userId,
    metrics: stats.metrics || {},
  };
}
