class AuditoriaService {
  constructor({ auditoriaRepository }) {
    this.auditoriaRepo = auditoriaRepository;
  }

  /**
   * Registra una acción en la base de datos de auditoría.
   * Fire-and-forget: nunca lanza, solo loguea si falla.
   *
   * @param {Object} data
   * @param {string|null}  data.usuario_id
   * @param {string}       data.accion        CREAR | ACTUALIZAR | ELIMINAR
   * @param {string}       data.modulo
   * @param {string}       data.resultado     EXITOSO | FALLIDO
   * @param {number}       data.statusCode
   * @param {string}       data.url
   * @param {string}       data.metodo
   * @param {string|null}  [data.recurso_id]
   * @param {string|null}  [data.ip]
   * @param {string|null}  [data.userAgent]
   * @param {Object}       [data.detalles]
   */
  async create(data) {
    try {
      return await this.auditoriaRepo.create(data);
    } catch (err) {
      console.error('⚠️  Error al registrar auditoría:', err.message);
    }
  }

  /**
   * Consulta paginada con filtros opcionales.
   *
   * @param {Object} options
   * @param {number}  [options.page=1]
   * @param {number}  [options.limit=50]
   * @param {string}  [options.usuario_id]   Filtrar por usuario
   * @param {string}  [options.modulo]       Filtrar por módulo (USERS, AUTH…)
   * @param {string}  [options.accion]       CREAR | ACTUALIZAR | ELIMINAR
   * @param {string}  [options.resultado]    Filtrar por resultado
   * @param {string}  [options.desde]        ISO date — inicio del rango
   * @param {string}  [options.hasta]        ISO date — fin del rango
   * @returns {{ logs: any[], pagination: Object }}
   */
  async getAll({
    page = 1,
    limit = 50,
    usuario_id,
    modulo,
    accion,
    resultado,
    desde,
    hasta,
  } = {}) {
    const filter = {};

    if (usuario_id) filter.usuario_id = usuario_id;
    if (modulo)     filter.modulo     = modulo.toUpperCase();
    if (accion)     filter.accion     = accion.toUpperCase();
    if (resultado)  filter.resultado  = resultado.toUpperCase();

    if (desde || hasta) {
      filter.fecha = {};
      if (desde) filter.fecha.$gte = new Date(desde);
      if (hasta) filter.fecha.$lte = new Date(hasta);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      this.auditoriaRepo.findPaginated({
        filter,
        skip,
        limit: Number(limit),
        sort: { fecha: -1 },
        populate: [
          { path: 'usuario_id', select: 'nombre apellido email cedula' }
        ]
      }),
      this.auditoriaRepo.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }
}

export default AuditoriaService;
