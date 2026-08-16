/**
 * auditoria.dto.js
 *
 * Funciones de mapeo que convierten documentos de la colección Auditoría
 * a objetos planos con contrato explícito.
 *
 * Maneja tanto el campo `usuario_id` sin poblar (ObjectId / string)
 * como poblado (sub-objeto con nombre, apellido, email, cedula).
 */

/**
 * DTO de un registro de auditoría.
 *
 * @param {object} log - Documento Mongoose o objeto plano (.lean() + populate)
 * @returns {object}
 */
export function toAuditoriaDTO(log) {
  // usuario_id puede venir sin poblar (solo ID) o con populate (objeto completo)
  let usuario = null;
  if (log.usuario_id) {
    const u = log.usuario_id;
    // Si es un objeto completo (populate ejecutado)
    if (typeof u === 'object' && u !== null && !Buffer.isBuffer(u)) {
      usuario = {
        id:       String(u._id ?? u.id),
        nombre:   u.nombre   ?? null,
        apellido: u.apellido ?? null,
        email:    u.email    ?? null,
        cedula:   u.cedula   ?? null,
      };
    } else {
      // Solo ObjectId — exponemos el ID como string
      usuario = { id: String(u) };
    }
  }

  return {
    id:        String(log._id ?? log.id),
    modulo:    log.modulo,
    accion:    log.accion,
    resultado: log.resultado,
    usuario,
    ip:        log.ip        ?? null,
    userAgent: log.userAgent ?? null,
    detalles:  log.detalles  ?? null,
    fecha:     log.fecha,
  };
}

/**
 * Transforma un array de registros de auditoría.
 *
 * @param {object[]} logs
 * @returns {object[]}
 */
export function toAuditoriaListDTO(logs) {
  return logs.map(toAuditoriaDTO);
}
