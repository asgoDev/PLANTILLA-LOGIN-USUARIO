import Auditoria from "./auditoria.model.js";

class AuditoriaRepository {
  async create(data) {
    return Auditoria.create(data);
  }

  async findPaginated({ filter = {}, skip = 0, limit = 50, sort = { fecha: -1 }, populate = [] } = {}) {
    let query = Auditoria.find(filter)
      .skip(skip)
      .limit(limit)
      .sort(sort);

    for (const pop of populate) {
      if (typeof pop === "string") {
        query = query.populate(pop);
      } else if (typeof pop === "object") {
        query = query.populate(pop.path, pop.select);
      }
    }

    return query.lean();
  }

  async countDocuments(filter = {}) {
    return Auditoria.countDocuments(filter);
  }
}

export default AuditoriaRepository;
