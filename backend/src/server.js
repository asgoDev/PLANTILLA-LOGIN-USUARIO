import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './infrastructure/database/db.js';
import { connectRedis, disconnectRedis } from './infrastructure/redis/redis.client.js';

// ── Middleware ──
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import { apiLimiter } from './shared/middleware/security.middleware.js';
import { auditMiddleware } from './container.js';
import errorHandler from './shared/middleware/errorHandler.js';

// ── Rutas ──
import { authRoutes, userRoutes, dashboardRoutes, auditoriaRoutes } from './container.js';
import createApiRouter from './routes/index.js';

// ── Configuración ──
const app = express();
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // Confiar en el reverse proxy en producción para express-rate-limit
}

const PORT = process.env.PORT || 3000;

// ══════════════════════════════════════════════════
//  MIDDLEWARE GLOBAL
// ══════════════════════════════════════════════════

app.use(helmet()); // Cabeceras de seguridad HTTP
app.use(mongoSanitize()); // Prevenir inyecciones NoSQL

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Permitir cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200 // Compatibilidad con navegadores antiguos y móviles
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Limitar tasa de peticiones en toda la API
app.use('/api', apiLimiter);

// Middleware de auditoría global (POST, PUT, DELETE)
app.use(auditMiddleware);

// ══════════════════════════════════════════════════
//  RUTAS
// ══════════════════════════════════════════════════

app.use('/api', createApiRouter({ authRoutes, userRoutes, dashboardRoutes, auditoriaRoutes }));

// ── Ruta no encontrada ──
app.use((_req, res) => {
    res.status(404).json({ message: 'Ruta no encontrada.' });
});

// ── Manejador de errores centralizado ──
app.use(errorHandler);

// ══════════════════════════════════════════════════
//  INICIAR SERVIDOR
// ══════════════════════════════════════════════════

const startServer = async () => {
    await connectDB();
    await connectRedis(); // Redis es opcional — si falla, el sistema sigue funcionando
    app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
        console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();

// ══════════════════════════════════════════════════
//  GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════

const shutdown = async (signal) => {
    console.log(`\n🛑 [${signal}] Cerrando servidor...`);
    await disconnectRedis();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

