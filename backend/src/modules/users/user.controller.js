import { successResponse, paginatedResponse } from "../../shared/dtos/response.dto.js";

class UserController {
  constructor({ userService }) {
    this.userService = userService;
  }

  /**
   * GET /api/users
   */
  async getUsers(req, res, next) {
    try {
      const result = await this.userService.getUsers(req.query);
      res.json(paginatedResponse(result.users, result.pagination));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.params.id);
      res.json(successResponse(user));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   */
  async createUser(req, res, next) {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json(successResponse(user, "Usuario creado exitosamente"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body);
      res.json(successResponse(user, "Usuario actualizado exitosamente"));
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const user = await this.userService.deleteUser(req.params.id, req.user.id);
      res.json(successResponse(user, "Usuario desactivado exitosamente"));
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
