import api from './api';

export const profileService = {
  /**
   * Obtiene la información completa del perfil del usuario autenticado.
   */
  getProfile: () => api.get('/profile'),

  /**
   * Actualiza los datos del perfil (nombre, apellido, email, teléfono, dirección, fotoPerfil).
   */
  updateProfile: (data) => api.put('/profile', data),

  /**
   * Actualiza exclusivamente la URL de la foto de perfil.
   */
  updatePhoto: (fotoPerfil) => api.put('/profile/photo', { fotoPerfil }),
};
