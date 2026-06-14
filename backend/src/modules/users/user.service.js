import User from "./user.model.js";
import AppError from "../../shared/errors/AppError.js";
import mongoose from "mongoose";

class UserService {
  /**
   * Obtiene todos los usuarios paginados y filtrados.
   */
  async getUsers({ page = 1, limit = 20, role, estado } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (estado) filter.estado = estado;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(filter),
    ]);

    return {
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };
  }

  /**
   * Obtiene un usuario por ID.
   */
  async getUserById(id) {
    const user = await User.findById(id);
    if (!user)
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
    return user;
  }

  /**
   * Crea un nuevo usuario.
   * req.body ya viene validado por validate(createUserSchema) en la ruta.
   */
  async createUser(data) {
    return User.create(data);
  }

  /**
   * Actualiza un usuario existente.
   * Siempre usa .save() para garantizar que el pre-save hook de bcrypt
   * se ejecute si se envía password, sin duplicar lógica condicional.
   */
  async updateUser(id, data) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("ID de usuario inválido o no provisto.", 400, "INVALID_USER_ID");
    }
    const user = await User.findById(id).select("+password");
    if (!user)
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");

    Object.assign(user, data);
    await user.save();
    return user;
  }

  /**
   * Desactiva un usuario (soft delete).
   * No se permite que un admin se desactive a sí mismo.
   */
  async deleteUser(id, currentUserId) {
    if (id === currentUserId.toString()) {
      throw new AppError(
        "No puede desactivar su propia cuenta.",
        400,
        "SELF_DEACTIVATION",
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      { estado: "inactivo" },
      { new: true },
    );

    if (!user)
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
    return user;
  }
}

export default new UserService();
