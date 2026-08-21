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
}

export default ProfileService;
