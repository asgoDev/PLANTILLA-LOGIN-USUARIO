import TokenBlacklist from "./auth.model.js";

/**
 * Repositorio de la blacklist de refresh tokens.
 *
 * Estrategia de doble capa:
 *  1. Redis  — verificación O(1) con TTL nativo (preferida, muy rápida)
 *  2. MongoDB — backup persistente y fallback si Redis no está disponible
 *
 * El constructor recibe un CacheService opcional; si no se inyecta (o Redis
 * no está disponible), el comportamiento es idéntico al original.
 */
class TokenBlacklistRepository {
  constructor({ cacheService } = {}) {
    this.cache = cacheService ?? null;
  }

  /**
   * Prefijo de clave Redis para la blacklist de tokens.
   * Evita colisiones con otras claves del cache.
   */
  #cacheKey(tokenHash) {
    return `blacklist:${tokenHash}`;
  }

  /**
   * Comprueba si un token está revocado.
   * Primero consulta Redis; si no está disponible, consulta MongoDB.
   *
   * @param {{ tokenHash: string }} query
   * @returns {Promise<boolean>}
   */
  async exists({ tokenHash }) {
    // 1. Intentar Redis primero (O(1))
    if (this.cache) {
      const inRedis = await this.cache.exists(this.#cacheKey(tokenHash));
      if (inRedis) return true;
    }

    // 2. Fallback a MongoDB
    return TokenBlacklist.exists({ tokenHash });
  }

  /**
   * Añade un token a la blacklist.
   * Escribe en Redis con TTL y en MongoDB de forma concurrente.
   *
   * @param {{ tokenHash: string, ttlSeconds?: number }} data
   */
  async create({ tokenHash, ttlSeconds }) {
    // Escritura concurrente en ambas capas (no bloqueante entre sí)
    const tasks = [
      // MongoDB — backup persistente con su propio TTL index
      TokenBlacklist.create({ tokenHash }).catch((err) => {
        if (err.code !== 11000) throw err; // Ignorar duplicados
      }),
    ];

    // Redis — solo si está disponible y se proporcionó TTL
    if (this.cache && ttlSeconds && ttlSeconds > 0) {
      tasks.push(this.cache.setExpiring(this.#cacheKey(tokenHash), ttlSeconds));
    }

    await Promise.all(tasks);
  }
}

export default TokenBlacklistRepository;
