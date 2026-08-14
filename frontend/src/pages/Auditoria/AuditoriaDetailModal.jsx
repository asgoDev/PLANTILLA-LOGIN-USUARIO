import Icon from '../../components/ui/Icon';
import DetailRow from '../../components/ui/DetailRow';
import ModalShell from '../../components/ui/ModalShell';
import { useModalStore } from '../../stores/modalStore';

/**
 * Modal de detalle técnico para un registro de auditoría.
 * Muestra payload completo (body, error, IP, User-Agent) en formato legible.
 *
 * @param {{ log: object|null }} props
 */
export default function AuditoriaDetailModal({ log }) {
  const closeModal = useModalStore((s) => s.closeModal);

  if (!log) return null;

  const isExitoso = log.resultado === 'EXITOSO';

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getUserLabel = (logItem) => {
    if (logItem.usuario_id && typeof logItem.usuario_id === 'object') {
      const { nombre, apellido, email } = logItem.usuario_id;
      return `${nombre} ${apellido} (${email})`;
    }
    return logItem.usuario_id || '—';
  };

  const accionColors = {
    CREAR: 'bg-primary/10 text-primary border-primary/20',
    ACTUALIZAR: 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/30',
    ELIMINAR: 'bg-error-container/30 text-error border-error-container/40',
    LOGIN: 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary-container/40',
    LOGOUT: 'bg-secondary-container/20 text-on-secondary-container border-secondary-container/20',
    ACCESO_DENEGADO: 'bg-error-container/40 text-error border-error-container/50',
  };

  return (
    <ModalShell maxWidth="max-w-2xl">
      {/* ── Cabecera ── */}
      <div className="flex items-start justify-between gap-md p-lg border-b border-outline-variant/15">
        <div className="flex flex-wrap items-center gap-sm">
          {/* Badge resultado */}
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${isExitoso
              ? 'bg-primary/10 text-primary border-primary/20'
              : 'bg-error-container/30 text-error border-error-container/40'
              }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isExitoso ? 'bg-primary' : 'bg-error'}`} />
            {log.resultado}
          </span>

          {/* Badge acción */}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${accionColors[log.accion] || 'bg-surface-container text-on-surface border-outline-variant/20'
              }`}
          >
            {log.accion}
          </span>

          {/* StatusCode */}
          <span
            className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${log.statusCode >= 400
              ? 'bg-error-container/20 text-error'
              : 'bg-primary/10 text-primary'
              }`}
          >
            {log.statusCode}
          </span>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={closeModal}
          className="flex-shrink-0 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-outline-variant/15 transition-colors"
          title="Cerrar"
        >
          <Icon name="close" size="20px" />
        </button>
      </div>

      {/* ── Contenido ── */}
      <div className="p-lg space-y-lg">
        {/* Fecha */}
        <p className="text-label-sm text-on-surface-variant flex items-center gap-xs">
          <Icon name="schedule" size="16px" />
          {formatFecha(log.fecha)}
        </p>

        {/* Info General */}
        <section>
          <h3 className="text-label-lg font-bold text-on-surface mb-sm flex items-center gap-xs">
            <Icon name="info" size="16px" className="text-primary" />
            Información General
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs text-body-sm">
            <DetailRow label="Usuario" value={getUserLabel(log)} />
            <DetailRow label="Módulo" value={log.modulo || '—'} />
            <DetailRow label="Método HTTP" value={log.metodo || '—'} mono />
            <DetailRow label="Recurso ID" value={log.recurso_id || '—'} mono />
          </div>
          <div className="mt-xs text-body-sm">
            <span className="text-on-surface-variant text-label-sm block mb-0.5">URL</span>
            <span className="font-mono text-xs break-all text-on-surface">{log.url || '—'}</span>
          </div>
        </section>

        {/* Contexto de Red */}
        <section>
          <h3 className="text-label-lg font-bold text-on-surface mb-sm flex items-center gap-xs">
            <Icon name="language" size="16px" className="text-primary" />
            Contexto de Red
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs text-body-sm">
            <DetailRow label="IP" value={log.ip || '—'} mono />
          </div>
          {log.userAgent && (
            <div className="mt-xs">
              <span className="text-on-surface-variant text-label-sm block mb-0.5">User-Agent</span>
              <span className="font-mono text-xs break-all text-on-surface">{log.userAgent}</span>
            </div>
          )}
        </section>

        {/* Payload Body */}
        {log.detalles?.body && Object.keys(log.detalles.body).length > 0 && (
          <section>
            <h3 className="text-label-lg font-bold text-on-surface mb-sm flex items-center gap-xs">
              <Icon name="data_object" size="16px" className="text-primary" />
              Payload (Request Body)
            </h3>
            <pre className="json-viewer">
              {JSON.stringify(log.detalles.body, null, 2)}
            </pre>
          </section>
        )}

        {/* Error */}
        {log.detalles?.error && (
          <section>
            <h3 className="text-label-lg font-bold text-error mb-sm flex items-center gap-xs">
              <Icon name="error" size="16px" />
              Detalle del Error
            </h3>
            <div className="bg-error-container/20 border border-error-container/40 rounded-xl p-md space-y-xs">
              {log.detalles.error.message && (
                <DetailRow label="Mensaje" value={log.detalles.error.message} />
              )}
              {log.detalles.error.code && (
                <DetailRow label="Código" value={log.detalles.error.code} mono />
              )}
            </div>
          </section>
        )}
      </div>
    </ModalShell>
  );
}
