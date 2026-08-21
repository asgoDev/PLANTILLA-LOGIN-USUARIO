import Icon from '../../../components/ui/Icon';

/**
 * StatCard
 *
 * Componente de tarjeta de métrica genérico y desacoplado del dominio/rol.
 *
 * @param {object} props
 * @param {string} props.label - Título o etiqueta descriptiva
 * @param {React.ReactNode} props.value - Valor o número a mostrar
 * @param {string} props.icon - Nombre del icono Material Symbols
 * @param {string} [props.trend] - Texto secundario o contexto
 * @param {string} [props.colorClass] - Clases Tailwind para tema de color e interactividad del icono
 */
export default function StatCard({ label, value, icon, trend, colorClass = '' }) {
  return (
    <div
      className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/10 
                 flex flex-col justify-between group hover:shadow-md transition-shadow h-32"
    >
      <div className="flex justify-between items-start">
        <span className="text-on-surface-variant font-label-lg uppercase tracking-wider text-xs">
          {label}
        </span>
        <div className={`p-xs rounded-lg transition-colors ${colorClass}`}>
          <Icon name={icon} />
        </div>
      </div>
      <div>
        <h3 className="text-headline-lg font-headline-lg text-on-surface">{value}</h3>
        {trend && <p className="text-label-sm text-on-surface-variant">{trend}</p>}
      </div>
    </div>
  );
}
