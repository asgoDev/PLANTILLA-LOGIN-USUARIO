import TokenBlacklist from "./auth.model.js";

class TokenBlacklistRepository {
  async exists(query) {
    return TokenBlacklist.exists(query);
  }

  async create(data) {
    return TokenBlacklist.create(data);
  }
}

export default TokenBlacklistRepository;
