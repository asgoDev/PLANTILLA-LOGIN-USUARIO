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
  return {
    usersCount:       stats.usersCount,
    activeUsersCount: stats.activeUsersCount,
    inactiveUsersCount: stats.usersCount - stats.activeUsersCount,
    auditCount:       stats.auditCount,
  };
}
