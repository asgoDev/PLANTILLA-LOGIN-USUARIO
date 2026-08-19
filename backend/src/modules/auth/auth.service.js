import AppError from '../../shared/errors/AppError.js';
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    getRefreshExpiresMs,
} from '../../infrastructure/jwt/jwt.utils.js';
import { toSessionUserDTO } from '../../shared/dtos/user.dto.js';

class AuthService {
    constructor({ userRepository, tokenBlacklistRepository, cacheService }) {
        this.userRepo = userRepository;
        this.tokenBlacklistRepo = tokenBlacklistRepository;
        this.cache = cacheService ?? null;
    }

    /** Clave de cache para el perfil de sesión de un usuario. */
    #userSessionKey(userId) {
        return `user:session:${userId}`;
    }

    /**
     * Autenticación de usuario con email/cédula y contraseña.
     *
     * req.body ya viene validado por el middleware validate(loginSchema),
     * por lo que no se necesita .parse() aquí.
     *
     * SEGURIDAD — timing-safe:
     * comparePassword siempre se ejecuta aunque el usuario no exista,
     * para evitar user enumeration por diferencia de tiempo de respuesta.
     */
    async login({ identifier, password }) {
        const isCedula = /^[VE]-\d{6,9}$/i.test(identifier);
        const query = isCedula
            ? { cedula: identifier.toUpperCase() }
            : { email: identifier.toLowerCase() };

        const user = await this.userRepo.findOne(query, '+password');

        // Ejecutar siempre una comparación para igualar el tiempo de respuesta
        const DUMMY_HASH = '$2b$12$eImiTXuWVxfM37uY4JANjQe5ds4vAMpN8BUDKPqO4yrIbmUxKKiJy';
        const isMatch = user
            ? await this.userRepo.comparePassword(user, password)
            : await import('bcrypt').then(({ default: bcrypt }) =>
                bcrypt.compare(password, DUMMY_HASH)
            );

        if (user?.estado === 'inactivo') {
            const err = new AppError(
                'Su cuenta está desactivada. Contacte al administrador.',
                403,
                'ACCOUNT_DISABLED'
            );
            err.userId = user._id; // para auditoría
            throw err;
        }

        if (!user || !isMatch) {
            throw new AppError('Credenciales inválidas.', 401, 'INVALID_CREDENTIALS');
        }

        const tokenPayload = { id: user._id, role: user.role };
        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        return {
            user: toSessionUserDTO(user),
            accessToken,
            refreshToken,
            sessionExpiry: Date.now() + getRefreshExpiresMs(),
        };
    }

    /**
     * Renueva el AccessToken usando el RefreshToken.
     */
    async refresh(token) {
        if (!token) {
            throw new AppError('No se proporcionó refresh token.', 401, 'MISSING_REFRESH_TOKEN');
        }

        const { createHash } = await import('crypto');
        const hash = createHash('sha256').update(token).digest('hex');
        // exists() comprueba Redis primero, luego MongoDB como fallback
        const isBlacklisted = await this.tokenBlacklistRepo.exists({ tokenHash: hash });
        
        if (isBlacklisted) {
            throw new AppError('El token de sesión ha sido revocado.', 401, 'REVOKED_REFRESH_TOKEN');
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(token);
        } catch (cause) {
            const err = new AppError('Refresh token inválido o expirado.', 401, 'INVALID_REFRESH_TOKEN');
            err.cause = cause;
            throw err;
        }

        const user = await this.userRepo.findById(decoded.id);
        if (!user || user.estado === 'inactivo') {
            throw new AppError('Usuario no encontrado o desactivado.', 401, 'USER_UNAVAILABLE');
        }

        await this.invalidateRefreshToken(token);

        const tokenPayload = { id: user._id, role: user.role };
        return {
            accessToken: generateAccessToken(tokenPayload),
            refreshToken: generateRefreshToken(tokenPayload),
            sessionExpiry: Date.now() + getRefreshExpiresMs(),
        };
    }

    /**
     * Obtiene el usuario autenticado actual.
     * Solo proyecta campos públicos para no exponer datos internos.
     */
    async getMe(userId) {
        const cacheKey = this.#userSessionKey(userId);
        const TTL = parseInt(process.env.CACHE_USER_SESSION_TTL ?? '300', 10);

        // 1. Cache hit — evitar la consulta a MongoDB
        if (this.cache) {
            const cached = await this.cache.get(cacheKey);
            if (cached) return cached;
        }

        // 2. Cache miss — consultar MongoDB y guardar en cache
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new AppError('Usuario no encontrado.', 404, 'USER_NOT_FOUND');
        }

        const dto = toSessionUserDTO(user);
        if (this.cache) await this.cache.set(cacheKey, dto, TTL);

        return dto;
    }

    /**
     * Invalida el cache de sesión de un usuario.
     * Llamar después de actualizar o desactivar un usuario.
     * @param {string} userId
     */
    async invalidateUserSessionCache(userId) {
        if (this.cache) {
            await this.cache.del(this.#userSessionKey(userId));
        }
    }

    /**
     * Invalida un refresh token añadiéndolo a la blacklist.
     * Requiere el modelo TokenBlacklist con TTL index.
     */
    async invalidateRefreshToken(token) {
        const { createHash } = await import('crypto');
        const hash = createHash('sha256').update(token).digest('hex');

        // Calcular el TTL restante del refresh token para sincronizar la expiración en Redis
        const refreshExpiresMs = getRefreshExpiresMs();
        const ttlSeconds = Math.ceil(refreshExpiresMs / 1000);

        // El repositorio escribe en Redis (con TTL) y en MongoDB de forma concurrente
        await this.tokenBlacklistRepo.create({ tokenHash: hash, ttlSeconds });
    }
}

export default AuthService;
