import Icon from '../../../components/ui/Icon';

/**
 * DashboardUnavailable
 *
 * Vista de respaldo informativa cuando un rol no tiene un panel de dashboard configurado.
 *
 * @param {object} props
 * @param {string} [props.role] - Rol actual del usuario
 */
export default function DashboardUnavailable({ role = 'desconocido' }) {
  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20 shadow-sm text-center py-12">
      <div className="w-16 h-16 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center mx-auto mb-4">
        <Icon name="dashboard_customize" size="32px" />
      </div>
      <h3 className="text-title-lg font-title-lg text-on-surface mb-2">
        Dashboard no disponible para rol: <span className="uppercase text-primary">{role}</span>
      </h3>
      <p className="text-body-md text-on-surface-variant max-w-md mx-auto">
        No se ha configurado una vista de estadísticas específica para este rol en el sistema.
      </p>
    </div>
  );
}
