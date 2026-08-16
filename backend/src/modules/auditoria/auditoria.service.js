import mongoose from 'mongoose';
import { toAuditoriaListDTO } from '../../shared/dtos/auditoria.dto.js';

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
   * @param {string}       data.accion        CREAR | ACTUALIZAR | ELIMINAR | LOGIN | LOGOUT | ACCESO_DENEGADO
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
   * @param {string}  [options.usuario_id]   Filtrar por usuario (ID o término de búsqueda por nombre/email/cédula)
   * @param {string}  [options.modulo]       Filtrar por módulo (USERS, AUTH…)
   * @param {string}  [options.accion]       CREAR | ACTUALIZAR | ELIMINAR | LOGIN | LOGOUT | ACCESO_DENEGADO
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

    if (usuario_id) {
      const term = usuario_id.trim();
      if (mongoose.Types.ObjectId.isValid(term) && String(new mongoose.Types.ObjectId(term)) === term) {
        filter.usuario_id = term;
      } else {
        const User = mongoose.model('User');
        const searchRegex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({
          $or: [
            { nombre: searchRegex },
            { apellido: searchRegex },
            { email: searchRegex },
            { cedula: searchRegex },
          ]
        }).select('_id').lean();
        const userIds = users.map((u) => u._id);
        filter.usuario_id = { $in: userIds };
      }
    }
    if (modulo)     filter.modulo     = modulo.toUpperCase();
    if (accion)     filter.accion     = accion.toUpperCase();
    if (resultado)  filter.resultado  = resultado.toUpperCase();

    if (desde || hasta) {
      filter.fecha = {};
      if (desde) filter.fecha.$gte = new Date(desde);
      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setUTCHours(23, 59, 59, 999);
        filter.fecha.$lte = hastaDate;
      }
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
      logs: toAuditoriaListDTO(logs),
      pagination: {
        total,
        page:  Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }
  /**
   * Retorna la lista de módulos únicos registrados en la colección.
   * Útil para poblar dinámicamente los filtros en el frontend.
   *
   * @returns {Promise<string[]>}
   */
  async getModules() {
    return this.auditoriaRepo.getDistinctModules();
  }
}

export default AuditoriaService;
