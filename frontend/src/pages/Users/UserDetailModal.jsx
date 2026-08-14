import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/ui/Icon';
import Avatar from '../../components/ui/Avatar';

/**
 * Modal de detalle de un usuario.
 * Muestra la información completa del usuario y permite acceder a edición
 * o activar/desactivar la cuenta directamente desde aquí.
 *
 * @param {{
 *   user: object|null,
 *   currentUserId: string,
 *   onClose: () => void,
 *   onToggleEstado: (user: object) => void,
 *   isTogglePending: boolean,
 * }} props
 */
export default function UserDetailModal({
  user,
  currentUserId,
  onClose,
  onToggleEstado,
  isTogglePending,
}) {
  const navigate = useNavigate();

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!user) return null;

  const fullName = `${user.nombre} ${user.apellido}`;
  const isActivo = user.estado === 'activo';
  const isSelf = user._id === currentUserId;

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-md pt-[10vh]"
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/20 animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cabecera ── */}
        <div className="flex items-start justify-between gap-md p-lg border-b border-outline-variant/15">
          <div className="flex items-center gap-md">
            <Avatar name={fullName} size="lg" />
            <div>
              <h2 className="text-title-md font-bold text-on-surface leading-tight">{fullName}</h2>
              <p className="text-body-sm text-on-surface-variant">{user.email}</p>
              {/* Badges */}
              <div className="flex flex-wrap gap-xs mt-xs">
                {/* Badge Rol */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase
                    ${user.role === 'admin'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-surface-container/60 text-on-surface border-outline-variant/10'
                    }`}
                >
                  {user.role}
                </span>

                {/* Badge Estado */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border
                    ${isActivo
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-error-container/30 text-error border-error-container/40'
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-primary' : 'bg-error'}`} />
                  {isActivo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-outline-variant/15 transition-colors"
            title="Cerrar"
          >
            <Icon name="close" size="20px" />
          </button>
        </div>

        {/* ── Contenido ── */}
        <div className="p-lg space-y-lg">

          {/* Información personal */}
          <section>
            <h3 className="text-label-lg font-bold text-on-surface mb-sm flex items-center gap-xs">
              <Icon name="person" size="16px" className="text-primary" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs text-body-sm">
              <DetailRow label="Cédula" value={user.cedula || '—'} />
              <DetailRow label="Teléfono" value={user.telefono || '—'} />
              <DetailRow label="Fecha de Nacimiento" value={formatFecha(user.fechaNacimiento)} />
              <DetailRow label="Rol" value={user.role || '—'} />
            </div>
            {user.direccion && (
              <div className="mt-xs">
                <span className="text-on-surface-variant text-label-sm block mb-0.5">Dirección</span>
                <span className="text-body-sm font-medium text-on-surface">{user.direccion}</span>
              </div>
            )}
          </section>

          {/* Actividad */}
          <section>
            <h3 className="text-label-lg font-bold text-on-surface mb-sm flex items-center gap-xs">
              <Icon name="history" size="16px" className="text-primary" />
              Actividad
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs text-body-sm">
              <DetailRow label="Creado el" value={formatFecha(user.createdAt)} />
              <DetailRow label="Última actualización" value={formatFecha(user.updatedAt)} />
            </div>
          </section>
        </div>

        {/* ── Footer con acciones ── */}
        <div className="p-lg border-t border-outline-variant/15 flex flex-wrap items-center justify-end gap-sm">
          {/* Botón Editar */}
          <button
            onClick={() => {
              onClose();
              navigate(`/usuarios/${user._id}`);
            }}
            className="inline-flex items-center gap-xs px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-all text-label-sm font-semibold active:scale-95"
            title="Editar usuario"
          >
            <Icon name="edit" size="18px" />
            Editar
          </button>

          {/* Botón Activar / Desactivar — oculto para el propio usuario */}
          {!isSelf && (
            <button
              onClick={() => onToggleEstado(user)}
              disabled={isTogglePending}
              className={`inline-flex items-center gap-xs px-4 py-2 rounded-lg border transition-all text-label-sm font-semibold active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
                ${isActivo
                  ? 'border-error/30 text-error hover:bg-error/5'
                  : 'border-primary/30 text-primary hover:bg-primary/5'
                }`}
              title={isActivo ? 'Desactivar cuenta' : 'Activar cuenta'}
            >
              <Icon name={isActivo ? 'block' : 'check_circle'} size="18px" />
              {isActivo ? 'Desactivar' : 'Activar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Fila de detalle reutilizable.
 */
function DetailRow({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-label-sm text-on-surface-variant">{label}</span>
      <span className={`text-on-surface ${mono ? 'font-mono text-xs' : 'text-body-sm font-medium'} break-all`}>
        {value}
      </span>
    </div>
  );
}
