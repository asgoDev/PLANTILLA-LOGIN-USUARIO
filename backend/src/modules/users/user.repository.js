import User from "./user.model.js";
import mongoose from "mongoose";
import AppError from "../../shared/errors/AppError.js";

class UserRepository {
  async findOne(query, selectFields = "") {
    let q = User.findOne(query);
    if (selectFields) {
      q = q.select(selectFields);
    }
    return q;
  }

  async findById(id, selectFields = "") {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("ID de usuario inválido o no provisto.", 400, "INVALID_USER_ID");
    }
    let q = User.findById(id);
    if (selectFields) {
      q = q.select(selectFields);
    }
    return q;
  }

  async findPaginated({ filter = {}, skip = 0, limit = 20, sort = { createdAt: -1 } } = {}) {
    return User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort)
      .lean();
  }

  async countDocuments(filter = {}) {
    return User.countDocuments(filter);
  }

  async create(data) {
    return User.create(data);
  }

  async save(userDoc) {
    return userDoc.save();
  }

  async findByIdAndUpdate(id, data, options = { new: true }) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("ID de usuario inválido o no provisto.", 400, "INVALID_USER_ID");
    }
    return User.findByIdAndUpdate(id, data, options);
  }

  async comparePassword(userDoc, candidatePassword) {
    if (!userDoc || typeof userDoc.comparePassword !== "function") {
      throw new AppError("Operación de contraseña inválida en este objeto.", 500);
    }
    return userDoc.comparePassword(candidatePassword);
  }
}

export default UserRepository;
