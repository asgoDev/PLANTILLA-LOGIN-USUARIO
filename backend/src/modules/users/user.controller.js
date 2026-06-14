import userService from "./user.service.js";

class UserController {
  /**
   * GET /api/users
   */
  async getUsers(req, res, next) {
    try {
      const result = await userService.getUsers(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   */
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ message: "Usuario creado exitosamente", user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json({ message: "Usuario actualizado exitosamente", user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const user = await userService.deleteUser(req.params.id, req.user.id);
      res.json({ message: "Usuario desactivado exitosamente", user });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
