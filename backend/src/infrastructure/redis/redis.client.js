import Redis from 'ioredis';

let redisClient = null;
let isRedisAvailable = false;

/**
 * Inicializa la conexión a Redis.
 * Si REDIS_URL no está definida o la conexión falla, el sistema
 * continúa sin cache (graceful degradation).
 */
export const connectRedis = async () => {
    if (!process.env.REDIS_URL) {
        console.warn('⚠️  [Redis] REDIS_URL no definida. Cache deshabilitado — el sistema funcionará sin Redis.');
        return;
    }

    redisClient = new Redis(process.env.REDIS_URL, {
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
            if (times > 5) {
                console.error('❌ [Redis] No se pudo conectar tras 5 intentos. Cache deshabilitado.');
                isRedisAvailable = false;
                return null; // Detener reintentos
            }
            return Math.min(times * 200, 2000); // Backoff exponencial (máx 2 segundos)
        },
        enableOfflineQueue: false, // No encolar comandos si Redis no está disponible
        lazyConnect: true,
    });

    redisClient.on('connect', () => {
        isRedisAvailable = true;
        console.log('✅ [Redis] Conexión establecida.');
    });

    redisClient.on('ready', () => {
        isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
        isRedisAvailable = false;
        // Solo loguear el error, no lanzar excepción — el servidor no debe caerse por Redis
        console.error(`⚠️  [Redis] Error de conexión: ${err.message}`);
    });

    redisClient.on('close', () => {
        isRedisAvailable = false;
        console.warn('⚠️  [Redis] Conexión cerrada.');
    });

    try {
        await redisClient.connect();
    } catch (err) {
        isRedisAvailable = false;
        console.error(`⚠️  [Redis] Fallo al conectar: ${err.message}. Continuando sin cache.`);
    }
};

/**
 * Cierra la conexión a Redis de forma ordenada.
 * Llamar en el shutdown del servidor.
 */
export const disconnectRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isRedisAvailable = false;
        console.log('🔌 [Redis] Conexión cerrada correctamente.');
    }
};

/**
 * Retorna el cliente Redis si está disponible, o null.
 * Los consumidores deben verificar null antes de operar.
 */
export const getRedisClient = () => (isRedisAvailable ? redisClient : null);
