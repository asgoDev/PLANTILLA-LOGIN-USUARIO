/**
 * response.dto.js
 *
 * Envoltorio genérico para estandarizar la forma de TODAS las respuestas
 * exitosas de la API.
 *
 * Contrato de respuesta:
 *   {
 *     success:    true,
 *     message?:   string,        // presente solo si se provee
 *     data:       any,           // payload principal
 *     pagination?: {             // presente solo en listas paginadas
 *       total:  number,
 *       page:   number,
 *       limit:  number,
 *       pages:  number,
 *     }
 *   }
 *
 * Las respuestas de ERROR mantienen { success: false, message, code? }
 * y son manejadas por el errorHandler.js existente (sin cambios necesarios).
 */

/**
 * Respuesta exitosa sin paginación.
 *
 * @param {any}    data    - Payload principal (DTO mapeado).
 * @param {string} [message] - Mensaje legible opcional.
 * @returns {object}
 */
export function successResponse(data, message = null) {
  const response = { success: true };
  if (message) response.message = message;
  response.data = data;
  return response;
}

/**
 * Respuesta exitosa con metadatos de paginación.
 *
 * @param {any[]}  data        - Array de items (ya mapeados con DTO).
 * @param {object} pagination  - { total, page, limit, pages }
 * @param {string} [message]   - Mensaje legible opcional.
 * @returns {object}
 */
export function paginatedResponse(data, pagination, message = null) {
  const response = { success: true };
  if (message) response.message = message;
  response.data       = data;
  response.pagination = pagination;
  return response;
}
