/**
 * Fila de detalle reutilizable para modales y paneles.
 */
export default function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className={`text-on-surface ${mono ? 'font-mono text-xs' : 'text-body-sm font-medium'} break-all`}>
        {value}
      </span>
    </div>
  );
}
