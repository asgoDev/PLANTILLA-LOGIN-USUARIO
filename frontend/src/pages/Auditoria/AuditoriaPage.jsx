import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAuditoriaLogs, useAuditoriaModules } from '../../hooks/useAuditoriaQueries';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/Icon';
import AuditoriaDetailModal from './AuditoriaDetailModal';
import toast from 'react-hot-toast';

export default function AuditoriaPage() {
  const currentUser = useAuthStore((s) => s.user);

  if (!currentUser || currentUser.role !== 'admin') {
    toast.error('No tiene permisos para acceder a esta sección.');
    return <Navigate to="/" replace />;
  }

  const [currentPage, setCurrentPage] = useState(1);
  const [moduloFilter, setModuloFilter] = useState('');
  const [accionFilter, setAccionFilter] = useState('');
  const [resultadoFilter, setResultadoFilter] = useState('');
  const [desdeFilter, setDesdeFilter] = useState('');
  const [hastaFilter, setHastaFilter] = useState('');
  const [usuarioInput, setUsuarioInput] = useState('');
  const [usuarioFilter, setUsuarioFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const filters = {};
  if (moduloFilter) filters.modulo = moduloFilter;
  if (accionFilter) filters.accion = accionFilter;
  if (resultadoFilter) filters.resultado = resultadoFilter;
  if (desdeFilter) filters.desde = desdeFilter;
  if (hastaFilter) filters.hasta = hastaFilter;
  if (usuarioFilter) filters.usuario_id = usuarioFilter;

  const { data, isLoading } = useAuditoriaLogs(currentPage, filters);

  // H-07: módulos dinámicos desde el backend
  const { data: modulesData } = useAuditoriaModules();
  const availableModules = modulesData || [];

  const logs = data?.logs || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1, limit: 50 };

  const hasActiveFilters =
    moduloFilter || accionFilter || resultadoFilter ||
    desdeFilter || hastaFilter || usuarioFilter;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      setCurrentPage(page);
    }
  };

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    setUsuarioFilter(usuarioInput.trim());
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setModuloFilter('');
    setAccionFilter('');
    setResultadoFilter('');
    setDesdeFilter('');
    setHastaFilter('');
    setUsuarioInput('');
    setUsuarioFilter('');
    setCurrentPage(1);
  };

  // H-10: Exportar logs actuales a CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No hay registros para exportar.');
      return;
    }

    const headers = [
      'Fecha', 'Usuario', 'Email', 'Módulo', 'Acción',
      'Resultado', 'Código HTTP', 'Método', 'URL', 'Recurso ID', 'IP', 'User-Agent',
    ];

    const rows = logs.map((log) => {
      const usuario =
        log.usuario_id && typeof log.usuario_id === 'object'
          ? `${log.usuario_id.nombre} ${log.usuario_id.apellido}`
          : (log.usuario_id || '');
      const email =
        log.usuario_id && typeof log.usuario_id === 'object'
          ? (log.usuario_id.email || '')
          : '';
      const fecha = log.fecha ? new Date(log.fecha).toLocaleString('es-VE') : '';

      return [
        fecha,
        usuario,
        email,
        log.modulo || '',
        log.accion || '',
        log.resultado || '',
        log.statusCode || '',
        log.metodo || '',
        log.url || '',
        log.recurso_id || '',
        log.ip || '',
        log.userAgent || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    });

    const csvContent =
      '\uFEFF' + // BOM para Excel
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `auditoria_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${logs.length} registros exportados correctamente.`);
  };

  const renderResultadoBadge = (resultado) => {
    const isExitoso = resultado === 'EXITOSO';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${isExitoso
          ? 'bg-primary/10 text-primary border-primary/20'
          : 'bg-error-container/30 text-error border-error-container/40'
          }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isExitoso ? 'bg-primary' : 'bg-error'}`} />
        {resultado}
      </span>
    );
  };

  const renderAccionBadge = (accion) => {
    const styles = {
      CREAR: 'bg-primary/10 text-primary border-primary/20',
      ACTUALIZAR: 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/30',
      ELIMINAR: 'bg-error-container/30 text-error border-error-container/40',
      LOGIN: 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary-container/40',
      LOGOUT: 'bg-secondary-container/20 text-on-secondary-container border-secondary-container/20',
      ACCESO_DENEGADO: 'bg-error-container/40 text-error border-error-container/50',
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[accion] || 'bg-surface-container text-on-surface border-outline-variant/20'
          }`}
      >
        {accion}
      </span>
    );
  };

  const renderModuloBadge = (modulo) => {
    const icons = {
      AUTH: 'lock',
      USERS: 'group',
      DASHBOARD: 'dashboard',
    };
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/20">
        <Icon name={icons[modulo] || 'category'} size="14px" />
        {modulo}
      </span>
    );
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    return new Date(fechaStr).toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const getUserLabel = (log) => {
    if (log.usuario_id && typeof log.usuario_id === 'object') {
      return `${log.usuario_id.nombre} ${log.usuario_id.apellido}`;
    }
    return log.usuario_id || '—';
  };

  // Clases de input/select reutilizables
  const selectCls =
    'w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-10 pr-4 py-2 text-body-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer';
  const dateCls =
    'w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-10 pr-3 py-2 text-body-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

  return (
    <div className="space-y-lg animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">
            Auditoría del Sistema
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Registro de acciones realizadas en la plataforma.
          </p>
        </div>

        <div className="flex items-center gap-sm self-start md:self-auto">
          {/* Contador de registros */}
          <div className="flex items-center gap-xs bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20">
            <Icon name="event_note" size="18px" className="text-primary" />
            <span className="text-label-sm font-semibold text-on-surface-variant">
              {pagination.total || 0} registros
            </span>
          </div>

          {/* H-10: Botón exportar CSV */}
          <Button
            id="btn-export-csv"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            icon={<Icon name="download" size="18px" />}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-surface-container-lowest rounded-xl p-md border border-outline-variant/10 shadow-sm space-y-md">

        {/* Fila 1: Módulo | Acción | Resultado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* H-07: Filtro por Módulo dinámico */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="category" size="20px" />
            </span>
            <select
              id="filter-modulo"
              value={moduloFilter}
              onChange={(e) => { setModuloFilter(e.target.value); setCurrentPage(1); }}
              className={selectCls}
            >
              <option value="">Todos los Módulos</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="arrow_drop_down" />
            </span>
          </div>

          {/* Filtro por Acción — ahora incluye LOGIN, LOGOUT, ACCESO_DENEGADO */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="bolt" size="20px" />
            </span>
            <select
              id="filter-accion"
              value={accionFilter}
              onChange={(e) => { setAccionFilter(e.target.value); setCurrentPage(1); }}
              className={selectCls}
            >
              <option value="">Todas las Acciones</option>
              <option value="CREAR">Crear</option>
              <option value="ACTUALIZAR">Actualizar</option>
              <option value="ELIMINAR">Eliminar</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="ACCESO_DENEGADO">Acceso Denegado</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="arrow_drop_down" />
            </span>
          </div>

          {/* Filtro por Resultado */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="check_circle" size="20px" />
            </span>
            <select
              id="filter-resultado"
              value={resultadoFilter}
              onChange={(e) => { setResultadoFilter(e.target.value); setCurrentPage(1); }}
              className={selectCls}
            >
              <option value="">Todos los Resultados</option>
              <option value="EXITOSO">Exitoso</option>
              <option value="FALLIDO">Fallido</option>
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="arrow_drop_down" />
            </span>
          </div>
        </div>

        {/* H-08: Fila 2 — Desde | Hasta | Usuario */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          {/* Desde */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="calendar_today" size="20px" />
            </span>
            <input
              id="filter-desde"
              type="date"
              value={desdeFilter}
              max={hastaFilter || undefined}
              onChange={(e) => { setDesdeFilter(e.target.value); setCurrentPage(1); }}
              className={dateCls}
              title="Fecha desde"
              placeholder="Desde"
            />
            {desdeFilter && (
              <span className="absolute -top-2 left-3 text-xs text-on-surface-variant bg-surface-container-lowest px-1 leading-none">
                Desde
              </span>
            )}
          </div>

          {/* Hasta */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
              <Icon name="event" size="20px" />
            </span>
            <input
              id="filter-hasta"
              type="date"
              value={hastaFilter}
              min={desdeFilter || undefined}
              onChange={(e) => { setHastaFilter(e.target.value); setCurrentPage(1); }}
              className={dateCls}
              title="Fecha hasta"
              placeholder="Hasta"
            />
            {hastaFilter && (
              <span className="absolute -top-2 left-3 text-xs text-on-surface-variant bg-surface-container-lowest px-1 leading-none">
                Hasta
              </span>
            )}
          </div>

          {/* Buscar por Usuario */}
          <form onSubmit={handleUserSearchSubmit} className="flex items-center gap-xs">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                <Icon name="person_search" size="20px" />
              </span>
              <input
                id="filter-usuario-input"
                type="text"
                value={usuarioInput}
                onChange={(e) => setUsuarioInput(e.target.value)}
                placeholder="Buscar por usuario (nombre, cédula...)"
                className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg pl-10 pr-8 py-2 text-body-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {usuarioInput && (
                <button
                  type="button"
                  onClick={() => {
                    setUsuarioInput('');
                    setUsuarioFilter('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-0.5"
                  title="Borrar búsqueda"
                >
                  <Icon name="close" size="16px" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-[38px] px-3 flex-shrink-0"
              title="Buscar usuario"
            >
              <Icon name="search" size="18px" />
              <span className="hidden sm:inline">Buscar</span>
            </Button>
          </form>
        </div>

        {/* Botón limpiar filtros — solo visible si hay alguno activo */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              id="btn-clear-filters"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-xs text-label-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <Icon name="filter_alt_off" size="16px" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Logs */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-xl flex flex-col items-center justify-center space-y-md">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-body-sm text-on-surface-variant font-medium">
                Cargando logs de auditoría...
              </p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-xl flex flex-col items-center justify-center space-y-sm text-center">
              <div className="w-16 h-16 rounded-full bg-outline-variant/10 text-outline flex items-center justify-center">
                <Icon name="receipt_long" size="36px" />
              </div>
              <h3 className="text-label-lg font-bold text-on-surface">
                No se encontraron registros
              </h3>
              <p className="text-body-sm text-on-surface-variant max-w-sm">
                No hay eventos de auditoría con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant font-label-lg text-xs uppercase tracking-wider">
                  <th className="py-md px-lg">Fecha</th>
                  <th className="py-md px-lg">Usuario</th>
                  <th className="py-md px-lg">Módulo</th>
                  <th className="py-md px-lg">Acción</th>
                  <th className="py-md px-lg">Resultado</th>
                  <th className="py-md px-lg">Código</th>
                  <th className="py-md px-lg">Recurso</th>
                  {/* H-09: columna visual que indica que la fila es clickeable */}
                  <th className="py-md px-lg sr-only">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-body-sm text-on-surface">
                {/* H-09: cada fila abre el modal al hacer clic */}
                {logs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-primary-container/5 transition-colors cursor-pointer group"
                    title="Ver detalle técnico"
                  >
                    <td className="py-md px-lg whitespace-nowrap text-on-surface-variant">
                      {formatFecha(log.fecha)}
                    </td>
                    <td className="py-md px-lg font-medium">
                      {getUserLabel(log)}
                    </td>
                    <td className="py-md px-lg">
                      {renderModuloBadge(log.modulo)}
                    </td>
                    <td className="py-md px-lg">
                      {renderAccionBadge(log.accion)}
                    </td>
                    <td className="py-md px-lg">
                      {renderResultadoBadge(log.resultado)}
                    </td>
                    <td className="py-md px-lg">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${log.statusCode >= 400
                          ? 'bg-error-container/20 text-error'
                          : 'bg-primary/10 text-primary'
                          }`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-md px-lg text-on-surface-variant text-xs font-mono truncate max-w-[160px]">
                      {log.url || '—'}
                    </td>
                    <td className="py-md px-lg">
                      <Icon
                        name="open_in_new"
                        size="14px"
                        className="text-outline opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {!isLoading && pagination.pages > 1 && (
          <div className="bg-surface-container-low px-lg py-sm border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-label-sm text-on-surface-variant font-medium">
              Página {pagination.page} de {pagination.pages} (Total:{' '}
              {pagination.total} registros)
            </span>
            <div className="flex gap-xs">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                icon={<Icon name="chevron_left" size="18px" />}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === pagination.pages}
                onClick={() => handlePageChange(currentPage + 1)}
                icon={<Icon name="chevron_right" size="18px" />}
                iconPosition="right"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* H-09: Modal de detalle técnico */}
      {selectedLog && (
        <AuditoriaDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
