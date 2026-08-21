/**
 * user.dto.js
 *
 * Funciones de mapeo que convierten un documento Mongoose User
 * a un objeto plano con contrato explícito (whitelist de campos).
 *
 * Nunca expone: password, __v, ni campos internos de Mongoose.
 * Normaliza: _id  →  id  en todas las respuestas.
 */

/**
 * DTO público completo de un usuario.
 * Usado en: GET /users, GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id
 *
 * @param {object} user - Documento Mongoose o objeto plano (.lean())
 * @returns {object}
 */
export function toUserDTO(user) {
  return {
    id:              String(user._id ?? user.id),
    nombre:          user.nombre,
    apellido:        user.apellido,
    cedula:          user.cedula,
    fechaNacimiento: user.fechaNacimiento,
    email:           user.email,
    role:            user.role,
    estado:          user.estado,
    telefono:        user.telefono ?? null,
    direccion:       user.direccion ?? null,
    fotoPerfil:      user.fotoPerfil ?? null,
    createdAt:       user.createdAt,
    updatedAt:       user.updatedAt,
  };
}

/**
 * DTO resumido para contexto de sesión.
 * Expone solo los campos que el frontend necesita para gestionar la sesión activa.
 * Usado en: POST /auth/login, GET /auth/me
 *
 * @param {object} user - Documento Mongoose o objeto plano
 * @returns {object}
 */
export function toSessionUserDTO(user) {
  return {
    id:         String(user._id ?? user.id),
    nombre:     user.nombre,
    apellido:   user.apellido,
    email:      user.email,
    role:       user.role,
    fotoPerfil: user.fotoPerfil ?? null,
  };
}

/**
 * Transforma un array de usuarios.
 * Usado en: GET /users (listado paginado)
 *
 * @param {object[]} users
 * @returns {object[]}
 */
export function toUserListDTO(users) {
  return users.map(toUserDTO);
}
