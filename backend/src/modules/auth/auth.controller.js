import { setTokenCookies, clearTokenCookies } from '../../infrastructure/jwt/jwt.utils.js';
import { successResponse } from '../../shared/dtos/response.dto.js';

/**
 * El controlador ya no compara strings de error.
 * AuthService lanza AppError con statusCode — el errorHandler lo captura directamente.
 * El controlador solo gestiona el flujo feliz y propaga errores con next(error).
 */
class AuthController {
    constructor({ authService }) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/login
     */
    async login(req, res, next) {
        try {
            const result = await this.authService.login(req.body);

            req.auditUserId = result.user.id;
            setTokenCookies(res, result.accessToken, result.refreshToken);

            res.json(successResponse(
                {
                    user: result.user,
                    accessToken: result.accessToken,
                    sessionExpiry: result.sessionExpiry,
                },
                'Inicio de sesión exitoso'
            ));
        } catch (error) {
            if (error.userId) req.auditUserId = error.userId;
            next(error); // AppError llega al errorHandler con su statusCode
        }
    }

    /**
     * POST /api/auth/refresh
     */
    async refresh(req, res, next) {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            const result = await this.authService.refresh(token);

            setTokenCookies(res, result.accessToken, result.refreshToken);

            res.json(successResponse(
                {
                    accessToken: result.accessToken,
                    sessionExpiry: result.sessionExpiry,
                },
                'Token renovado exitosamente'
            ));
        } catch (error) {
            clearTokenCookies(res);
            next(error);
        }
    }

    /**
     * POST /api/auth/logout
     */
    async logout(req, res, next) {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            if (token) await this.authService.invalidateRefreshToken(token);
        } catch (error) {
            // No bloquear el logout si falla la invalidación; loguear y continuar
            console.error('Error al invalidar refresh token:', error);
        } finally {
            clearTokenCookies(res);
            res.json(successResponse(null, 'Sesión cerrada exitosamente'));
        }
    }

    /**
     * GET /api/auth/me
     */
    async getMe(req, res, next) {
        try {
            const user = await this.authService.getMe(req.user.id);
            res.json(successResponse(user));
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
