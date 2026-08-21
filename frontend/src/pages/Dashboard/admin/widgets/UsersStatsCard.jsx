import StatCard from '../../shared/StatCard';

/**
 * UsersStatsCard
 *
 * Widget para métricas de usuarios del Administrador.
 *
 * @param {object} props
 * @param {object} [props.data] - Objeto de datos con las métricas
 * @param {boolean} [props.isLoading] - Estado de carga
 */
export default function UsersStatsCard({ data, isLoading }) {
  return (
    <>
      <StatCard
        label="Usuarios registrados"
        value={isLoading ? '—' : data?.usersCount}
        icon="group"
        trend="Total en el sistema"
        colorClass="text-primary bg-primary-container/10 group-hover:bg-primary-container group-hover:text-white"
      />
      <StatCard
        label="Usuarios activos"
        value={isLoading ? '—' : data?.activeUsersCount}
        icon="verified_user"
        trend="Cuentas con estado activo"
        colorClass="text-secondary bg-secondary-container/20 group-hover:bg-secondary group-hover:text-white"
      />
    </>
  );
}
