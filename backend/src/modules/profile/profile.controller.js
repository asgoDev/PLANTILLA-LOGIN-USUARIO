import { successResponse } from '../../shared/dtos/response.dto.js';

class ProfileController {
  constructor({ profileService }) {
    this.profileService = profileService;
  }

  /**
   * GET /api/profile
   */
  async getProfile(req, res, next) {
    try {
      const profile = await this.profileService.getProfile(req.user.id);
      res.json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile
   */
  async updateProfile(req, res, next) {
    try {
      const updated = await this.profileService.updateProfile(req.user.id, req.body);
      res.json(successResponse(updated, 'Perfil actualizado exitosamente'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/profile/photo
   */
  async updatePhoto(req, res, next) {
    try {
      const { fotoPerfil } = req.body;
      const updated = await this.profileService.updatePhoto(req.user.id, fotoPerfil);
      res.json(successResponse(updated, 'Foto de perfil actualizada exitosamente'));
    } catch (error) {
      next(error);
    }
  }
}

export default ProfileController;
