// ── Repositorios (implementación Mongoose) ──
import UserRepository from './modules/users/user.repository.js';
import TokenBlacklistRepository from './modules/auth/auth.repository.js';
import AuditoriaRepository from './modules/auditoria/auditoria.repository.js';

// ── Services ──
import AuthService from './modules/auth/auth.service.js';
import UserService from './modules/users/user.service.js';
import AuditoriaService from './modules/auditoria/auditoria.service.js';
import DashboardService from './modules/dashboard/dashboard.service.js';

// ── Controllers ──
import AuthController from './modules/auth/auth.controller.js';
import UserController from './modules/users/user.controller.js';
import AuditoriaController from './modules/auditoria/auditoria.controller.js';
import DashboardController from './modules/dashboard/dashboard.controller.js';

// ── Routes (factories) ──
import createAuthRoutes from './modules/auth/auth.routes.js';
import createUserRoutes from './modules/users/user.routes.js';
import createAuditoriaRoutes from './modules/auditoria/auditoria.routes.js';
import createDashboardRoutes from './modules/dashboard/dashboard.routes.js';

// ── Middleware ──
import createAuditMiddleware from './shared/middleware/audit.middleware.js';

// ═══════════════════════════════════════════
//  COMPOSICIÓN
// ═══════════════════════════════════════════

// 1. Repositorios
const userRepository = new UserRepository();
const tokenBlacklistRepository = new TokenBlacklistRepository();
const auditoriaRepository = new AuditoriaRepository();

// 2. Services (reciben repos)
const authService = new AuthService({ userRepository, tokenBlacklistRepository });
const userService = new UserService({ userRepository });
const auditoriaService = new AuditoriaService({ auditoriaRepository });
const dashboardService = new DashboardService({ userRepository, auditoriaRepository });

// 3. Controllers (reciben services)
const authController = new AuthController({ authService });
const userController = new UserController({ userService });
const auditoriaController = new AuditoriaController({ auditoriaService });
const dashboardController = new DashboardController({ dashboardService });

// 4. Routes (reciben controllers)
const authRoutes = createAuthRoutes(authController);
const userRoutes = createUserRoutes(userController);
const auditoriaRoutes = createAuditoriaRoutes(auditoriaController);
const dashboardRoutes = createDashboardRoutes(dashboardController);

// 5. Middleware inyectado
const auditMiddleware = createAuditMiddleware(auditoriaService);

export {
  authRoutes,
  userRoutes,
  auditoriaRoutes,
  dashboardRoutes,
  auditMiddleware,
  userRepository,
  authService,
  userService,
  auditoriaService,
  dashboardService,
};
