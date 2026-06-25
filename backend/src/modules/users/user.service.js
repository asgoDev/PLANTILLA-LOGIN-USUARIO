import AppError from "../../shared/errors/AppError.js";

class UserService {
  constructor({ userRepository }) {
    this.userRepo = userRepository;
  }

  /**
   * Obtiene todos los usuarios paginados y filtrados.
   */
  async getUsers({ page = 1, limit = 20, role, estado } = {}) {
    const filter = {};
    if (role) filter.role = role;
    if (estado) filter.estado = estado;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      this.userRepo.findPaginated({
        filter,
        skip,
        limit: Number(limit),
        sort: { createdAt: -1 }
      }),
      this.userRepo.countDocuments(filter),
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
    const user = await this.userRepo.findById(id);
    if (!user)
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
    return user;
  }

  /**
   * Crea un nuevo usuario.
   * req.body ya viene validado por validate(createUserSchema) en la ruta.
   */
  async createUser(data) {
    return this.userRepo.create(data);
  }

  /**
   * Actualiza un usuario existente.
   * Siempre usa .save() para garantizar que el pre-save hook de bcrypt
   * se ejecute si se envía password, sin duplicar lógica condicional.
   */
  async updateUser(id, data) {
    const user = await this.userRepo.findById(id, "+password");
    if (!user)
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");

    Object.assign(user, data);
    await this.userRepo.save(user);
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

    const user = await this.userRepo.findByIdAndUpdate(
      id,
      { estado: "inactivo" },
      { new: true }
    );

    if (!user)
      throw new AppError("Usuario no encontrado.", 404, "USER_NOT_FOUND");
    return user;
  }
}

export default UserService;
