import { getRedisClient } from './redis.client.js';

/**
 * Servicio genérico de cache sobre Redis.
 *
 * Todos los métodos implementan graceful degradation:
 * si Redis no está disponible, retornan null/false sin lanzar errores,
 * y el caller cae al fallback (consulta a MongoDB).
 */
class CacheService {
    /**
     * Obtiene un valor del cache.
     * @returns {Promise<any|null>} El valor deserializado, o null si no existe / Redis no disponible.
     */
    async get(key) {
        try {
            const client = getRedisClient();
            if (!client) return null;

            const raw = await client.get(key);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.warn(`⚠️  [Cache] Error en GET "${key}": ${err.message}`);
            return null;
        }
    }

    /**
     * Guarda un valor en el cache.
     * @param {string} key  - Clave Redis
     * @param {any}    value - Valor a guardar (se serializa a JSON)
     * @param {number} [ttl=60] - Tiempo de vida en segundos
     * @returns {Promise<boolean>} true si se guardó, false si no
     */
    async set(key, value, ttl = 60) {
        try {
            const client = getRedisClient();
            if (!client) return false;

            await client.set(key, JSON.stringify(value), 'EX', ttl);
            return true;
        } catch (err) {
            console.warn(`⚠️  [Cache] Error en SET "${key}": ${err.message}`);
            return false;
        }
    }

    /**
     * Elimina una o varias claves del cache.
     * @param {...string} keys - Claves a eliminar
     */
    async del(...keys) {
        try {
            const client = getRedisClient();
            if (!client || !keys.length) return;

            await client.del(...keys);
        } catch (err) {
            console.warn(`⚠️  [Cache] Error en DEL "${keys.join(', ')}": ${err.message}`);
        }
    }

    /**
     * Elimina claves que coincidan con un patrón (ej: 'dashboard:stats:*').
     * Usa scanStream para no bloquear el hilo de Redis en producción.
     * @param {string} pattern - Patrón de búsqueda (glob)
     */
    async delPattern(pattern) {
        try {
            const client = getRedisClient();
            if (!client) return;

            const stream = client.scanStream({
                match: pattern,
                count: 100,
            });

            stream.on('data', async (keys = []) => {
                if (keys.length) {
                    stream.pause();
                    await client.del(...keys);
                    stream.resume();
                }
            });
        } catch (err) {
            console.warn(`⚠️  [Cache] Error en delPattern "${pattern}": ${err.message}`);
        }
    }

    /**
     * Guarda un flag de expiración (sin valor, solo presencia).
     * Útil para la token blacklist.
     * @param {string} key
     * @param {number} ttlSeconds
     */
    async setExpiring(key, ttlSeconds) {
        try {
            const client = getRedisClient();
            if (!client) return false;

            await client.set(key, '1', 'EX', ttlSeconds);
            return true;
        } catch (err) {
            console.warn(`⚠️  [Cache] Error en SET-EXPIRING "${key}": ${err.message}`);
            return false;
        }
    }

    /**
     * Comprueba si una clave existe en Redis.
     * @returns {Promise<boolean>}
     */
    async exists(key) {
        try {
            const client = getRedisClient();
            if (!client) return false;

            const result = await client.exists(key);
            return result === 1;
        } catch (err) {
            console.warn(`⚠️  [Cache] Error en EXISTS "${key}": ${err.message}`);
            return false;
        }
    }
}

export default CacheService;
