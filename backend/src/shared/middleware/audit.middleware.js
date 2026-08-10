/**
 * Mapa de método HTTP → acción de auditoría
 */
const METHOD_ACTION_MAP = {
  POST:   'CREAR',
  PUT:    'ACTUALIZAR',
  PATCH:  'ACTUALIZAR',
  DELETE: 'ELIMINAR',
};

/**
 * Extrae el módulo a partir de la ruta del request.
 * Ejemplo: /api/users/123 → "USERS"  |  /api/auth/login → "AUTH"
 */
const extractModule = (path) => {
  const segments = path.split('/').filter(Boolean);
  const apiIndex = segments.indexOf('api');
  return apiIndex !== -1 && segments[apiIndex + 1]
    ? segments[apiIndex + 1].toUpperCase()
    : 'GENERAL';
};

/**
 * Extrae el ID del recurso afectado.
 * Prioridad: parámetro :id de la ruta > campo id/._id de la respuesta JSON.
 *
 * @param {import('express').Request} req
 * @param {any} responseBody  Cuerpo ya parseado de la respuesta
 */
const extractResourceId = (req, responseBody) => {
  if (req.params?.id) return req.params.id;
  if (typeof responseBody === 'object' && responseBody !== null) {
    return (
      responseBody._id     ||
      responseBody.id      ||
      responseBody.user?.id ||
      responseBody.user?._id ||
      null
    );
  }
  return null;
};

/**
 * Patrón regex para detectar nombres de campos sensibles
 * en cualquier nivel de anidación del objeto.
 */
const SENSITIVE_KEYS = /^(password|confirmPassword|newPassword|oldPassword|accessToken|refreshToken|token|secret|pin|creditCard|cvv|ssn)$/i;

/**
 * Elimina campos sensibles del body de forma recursiva
 * antes de guardar en auditoría.
 */
const sanitizeBody = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeBody);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.test(key)) {
      sanitized[key] = '[PROTEGIDO]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

/**
 * Middleware global de auditoría.
 *
 * Usa el evento 'finish' de res en lugar de interceptar res.json,
 * así captura TODAS las respuestas: las del controlador (2xx) y las
 * del errorHandler (4xx / 5xx) por igual.
 *
 * El cuerpo de la respuesta se recupera desde res.__auditBody, que
 * el parche de res.json almacena sin romper el flujo normal.
 */
const createAuditMiddleware = (auditoriaService) => {
  return (req, res, next) => {
    const action = METHOD_ACTION_MAP[req.method];

    // Solo auditar métodos de escritura
    if (!action) return next();

    // ── Parche mínimo: capturar el body de respuesta sin interferir ──────────
    // No devolvemos desde aquí; solo guardamos el valor para usarlo en 'finish'.
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      res.__auditBody = body;
      return originalJson(body);
    };

    // ── Lógica de auditoría al finalizar la respuesta ────────────────────────
    res.on('finish', () => {
      const userId      = req.user?.id || req.auditUserId || null;
      const isAuthRoute = req.originalUrl.includes('/api/auth');

      // Excluir la ruta de refresh para evitar el inflado masivo de la colección
      const isRefreshRoute = req.originalUrl.includes('/api/auth/refresh');
      if (isRefreshRoute) return;

      // Detectar fallos de seguridad (intentos no autorizados)
      const isSecurityFailure = res.statusCode === 401 || res.statusCode === 403;

      // Registrar si: hay usuario, es ruta auth, o es un fallo de seguridad
      if (!userId && !isAuthRoute && !isSecurityFailure) return;

      // ── Determinar acción específica para rutas de autenticación / seguridad ──
      let finalAction = action;
      if (isSecurityFailure && !userId) {
        finalAction = 'ACCESO_DENEGADO';
      } else if (isAuthRoute) {
        if (req.originalUrl.includes('login')) {
          finalAction = 'LOGIN';
        } else if (req.originalUrl.includes('logout')) {
          finalAction = 'LOGOUT';
        }
      }

      const body      = res.__auditBody;
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

      auditoriaService.create({
        usuario_id: userId,
        accion:     finalAction,
        modulo:     extractModule(req.originalUrl),
        resultado:  isSuccess ? 'EXITOSO' : 'FALLIDO',
        statusCode: res.statusCode,
        recurso_id: extractResourceId(req, body) ?? null,
        url:        req.originalUrl,
        metodo:     req.method,
        ip:         req.ip || req.socket?.remoteAddress || null,
        userAgent:  req.headers['user-agent'] || null,
        detalles: {
          body:      sanitizeBody(req.body),
          // En respuestas de error el errorHandler envía { success, message, code? }
          // Lo capturamos para poder filtrar por tipo de error en el dashboard
          error: !isSuccess && typeof body === 'object'
            ? { message: body?.message, code: body?.code }
            : undefined,
        },
      });
      // fire-and-forget: el catch vive dentro de auditoriaService.create
    });

    next();
  };
};

export default createAuditMiddleware;
