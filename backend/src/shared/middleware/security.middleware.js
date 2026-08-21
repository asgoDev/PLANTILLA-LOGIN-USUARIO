import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../../infrastructure/redis/redis.client.js';

/**
 * Crea el store para el rate limiter.
 * Usa Redis si está disponible; fallback a memoria si no.
 */
const createStore = (prefix) => {
    const client = getRedisClient();
    if (client) {
        return new RedisStore({
            sendCommand: (...args) => client.call(...args),
            prefix: `rl:${prefix}:`,
        });
    }
    return undefined; // express-rate-limit usa memoria por defecto
};

/**
 * Limitador general para todas las peticiones de la API.
 * Evita abuso general y escaneo de vulnerabilidades.
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Límite de 200 peticiones por IP
    message: {
        message: 'Demasiadas peticiones desde esta IP. Por favor intente de nuevo más tarde.',
    },
    standardHeaders: true, // Devuelve información del límite en las cabeceras `RateLimit-*`
    legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*` antiguas
    store: createStore('api'),
});

/**
 * Limitador estricto para rutas de autenticación (Login).
 * Protege contra ataques de fuerza bruta.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Límite de 10 intentos de inicio de sesión por IP
    message: {
        message: 'Demasiados intentos de inicio de sesión. Por favor intente de nuevo en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('auth'),
});

/**
 * Limitador estricto para el cambio de contraseña.
 * Permite máximo 5 intentos cada 15 minutos por IP.
 * Previene ataques de fuerza bruta sobre la contraseña actual del usuario.
 */
export const passwordChangeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,
    message: {
        message: 'Demasiados intentos de cambio de contraseña. Por favor intente de nuevo en 15 minutos.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore('pwd-change'),
});

