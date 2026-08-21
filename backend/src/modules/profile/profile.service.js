import AppError from '../../shared/errors/AppError.js';
import { toUserDTO } from '../../shared/dtos/user.dto.js';

class ProfileService {
  constructor({ userRepository, authService }) {
    this.userRepo = userRepository;
    this.authService = authService ?? null;
  }

  /**
   * Obtiene la información de perfil del usuario autenticado.
   * @param {string} userId
   */
  async getProfile(userId) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }
    return toUserDTO(user);
  }

  /**
   * Actualiza los datos permitidos del perfil del usuario autenticado.
   * @param {string} userId
   * @param {object} data
   */
  async updateProfile(userId, data) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }

    // Si se intenta cambiar el email, verificar que no esté en uso por otro usuario
    if (data.email && data.email !== user.email) {
      const existing = await this.userRepo.findOne({ email: data.email });
      if (existing && existing._id.toString() !== userId.toString()) {
        throw new AppError(
          'El correo electrónico ya está registrado por otro usuario.',
          409,
          'EMAIL_ALREADY_EXISTS'
        );
      }
    }

    // Campos editables por el propio usuario
    const allowedFields = ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'fotoPerfil'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    }

    await this.userRepo.save(user);

    // Invalidar cache de sesión
    await this.authService?.invalidateUserSessionCache(userId);

    return toUserDTO(user);
  }

  /**
   * Actualiza exclusivamente la foto de perfil del usuario.
   * @param {string} userId
   * @param {string|null} fotoPerfil
   */
  async updatePhoto(userId, fotoPerfil) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }

    user.fotoPerfil = fotoPerfil || null;
    await this.userRepo.save(user);

    // Invalidar cache de sesión
    await this.authService?.invalidateUserSessionCache(userId);

    return toUserDTO(user);
  }

  /**
   * Cambia la contraseña del usuario autenticado verificando la contraseña actual.
   *
   * SEGURIDAD:
   *  - Requiere la contraseña actual para autorizar el cambio (previene abuso de sesiones robadas).
   *  - Usa .save() para que el pre-save hook de Mongoose hashee la nueva contraseña con bcrypt.
   *  - Invalida la cache de sesión del usuario al terminar.
   *
   * @param {string} userId          ID del usuario autenticado
   * @param {string} currentPassword Contraseña actual en texto plano
   * @param {string} newPassword     Nueva contraseña en texto plano (ya validada por Zod)
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    // 1. Obtener el usuario incluyendo el campo password (select: false en el modelo)
    const user = await this.userRepo.findById(userId, '+password');
    if (!user) {
      throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
    }

    // 2. Verificar la contraseña actual — timing-safe vía bcrypt.compare
    const isMatch = await this.userRepo.comparePassword(user, currentPassword);
    if (!isMatch) {
      throw new AppError(
        'La contraseña actual es incorrecta.',
        401,
        'INVALID_CURRENT_PASSWORD'
      );
    }

    // 3. Asignar la nueva contraseña — el pre-save hook la hashea automáticamente
    user.password = newPassword;
    await this.userRepo.save(user);

    // 4. Invalidar cache de sesión para forzar nueva autenticación
    await this.authService?.invalidateUserSessionCache(userId);
  }

}

export default ProfileService;
