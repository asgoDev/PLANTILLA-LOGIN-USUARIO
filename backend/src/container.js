// ── Repositorios (implementación Mongoose) ──
import UserRepository from './modules/users/user.repository.js';
import TokenBlacklistRepository from './modules/auth/auth.repository.js';
import AuditoriaRepository from './modules/auditoria/auditoria.repository.js';

// ── Infraestructura Redis ──
import CacheService from './infrastructure/redis/cache.service.js';

// ── Providers ──
import createDashboardProviders from './modules/dashboard/providers/index.js';

// ── Services ──
import AuthService from './modules/auth/auth.service.js';
import UserService from './modules/users/user.service.js';
import AuditoriaService from './modules/auditoria/auditoria.service.js';
import DashboardService from './modules/dashboard/dashboard.service.js';
import ProfileService from './modules/profile/profile.service.js';

// ── Controllers ──
import AuthController from './modules/auth/auth.controller.js';
import UserController from './modules/users/user.controller.js';
import AuditoriaController from './modules/auditoria/auditoria.controller.js';
import DashboardController from './modules/dashboard/dashboard.controller.js';
import ProfileController from './modules/profile/profile.controller.js';

// ── Routes (factories) ──
import createAuthRoutes from './modules/auth/auth.routes.js';
import createUserRoutes from './modules/users/user.routes.js';
import createAuditoriaRoutes from './modules/auditoria/auditoria.routes.js';
import createDashboardRoutes from './modules/dashboard/dashboard.routes.js';
import createProfileRoutes from './modules/profile/profile.routes.js';

// ── Middleware ──
import createAuditMiddleware from './shared/middleware/audit.middleware.js';

// ═══════════════════════════════════════════
//  COMPOSICIÓN
// ═══════════════════════════════════════════

// 0. Cache (infraestructura transversal)
const cacheService = new CacheService();

// 1. Repositorios
const userRepository = new UserRepository();
const tokenBlacklistRepository = new TokenBlacklistRepository({ cacheService });
const auditoriaRepository = new AuditoriaRepository();

// 2. Providers (estrategia por rol)
const dashboardProviders = createDashboardProviders({ userRepository, auditoriaRepository });

// 3. Services (reciben repos / providers + cache opcional)
const authService = new AuthService({ userRepository, tokenBlacklistRepository, cacheService });
const dashboardService = new DashboardService({ providersByRole: dashboardProviders });
const auditoriaService = new AuditoriaService({ auditoriaRepository });
const userService = new UserService({ userRepository, authService });
const profileService = new ProfileService({ userRepository, authService });

// 3. Controllers (reciben services)
const authController = new AuthController({ authService });
const userController = new UserController({ userService });
const auditoriaController = new AuditoriaController({ auditoriaService });
const dashboardController = new DashboardController({ dashboardService });
const profileController = new ProfileController({ profileService });

// 4. Routes (reciben controllers)
const authRoutes = createAuthRoutes(authController);
const userRoutes = createUserRoutes(userController);
const auditoriaRoutes = createAuditoriaRoutes(auditoriaController);
const dashboardRoutes = createDashboardRoutes(dashboardController);
const profileRoutes = createProfileRoutes(profileController);

// 5. Middleware inyectado
const auditMiddleware = createAuditMiddleware(auditoriaService);

export {
  authRoutes,
  userRoutes,
  auditoriaRoutes,
  dashboardRoutes,
  profileRoutes,
  auditMiddleware,
  userRepository,
  authService,
  userService,
  profileService,
  auditoriaService,
  dashboardService,
  cacheService,
};

