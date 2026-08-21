import StatCard from '../../shared/StatCard';

/**
 * AuditStatsCard
 *
 * Widget para métricas de auditoría del Administrador.
 *
 * @param {object} props
 * @param {object} [props.data] - Objeto de datos con las métricas
 * @param {boolean} [props.isLoading] - Estado de carga
 */
export default function AuditStatsCard({ data, isLoading }) {
  return (
    <StatCard
      label="Eventos de auditoría"
      value={isLoading ? '—' : data?.auditCount}
      icon="history"
      trend="Acciones registradas"
      colorClass="text-tertiary bg-tertiary-fixed-dim/20 group-hover:bg-tertiary group-hover:text-white"
    />
  );
}
