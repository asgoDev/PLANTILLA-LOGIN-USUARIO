# Plantilla de Login & Control de Usuarios

Base full-stack de código abierto con **autenticación JWT**, **control de acceso basado en roles (RBAC)** (roles `admin` / `usuario`) y **auditoría** de acciones integrado en una interfaz moderna y responsiva.

Esta plantilla está diseñada para servir como punto de partida para cualquier sistema web que requiera control de acceso y gestión de usuarios.

## Características principales

- **Autenticación robusta**: Login, registro de usuarios, cookies HttpOnly seguras y flujo de renovación con refresh tokens.
- **Panel Administrativo (CRUD)**: Gestión completa de usuarios (creación, edición, consulta, activación/desactivación) protegida para roles de administrador.
- **Dashboard de Control**: Estadísticas básicas en tiempo real (usuarios registrados, activos, eventos de auditoría).
- **Diseño Moderno & Responsivo**: Interfaz fluida y limpia, sidebar colapsable, menú adaptativo y alertas de sistema.
- **Sistema de Auditoría**: Registro automático de eventos clave en el sistema para control de seguridad.
- **Validación robusta**: Validación de esquemas tanto en frontend como en backend usando Zod.
- **Gestión de Estado**: Manejo de estado del cliente mediante Zustand (`authStore`, `userStore`, `uiStore`).
- **Seguridad**: Implementación de Helmet, rate-limiting contra ataques de fuerza bruta y saneamiento de consultas de MongoDB.

## Stack Tecnológico

| Capa | Tecnologías utilizadas |
|------|-------------|
| **Backend** | Node.js (ESM) + Express 4 + Mongoose 8 + Zod |
| **Frontend** | React 18 + Vite + Tailwind CSS + Zustand |
| **Base de Datos** | MongoDB (usando Mongoose) |
| **Seguridad / Auth** | JWT (Access + Refresh Token) + Bcrypt |

## Estructura del Proyecto

```
├── backend/
│   ├── config/          (Configuraciones del sistema y base de datos)
│   ├── models/          (Modelos Mongoose: User, Auditoria)
│   ├── routes/          (Rutas de Express: auth, users, dashboard)
│   ├── controllers/     (Lógica de controladores por módulo)
│   ├── services/        (Servicios de base de datos)
│   ├── middleware/      (Validación de tokens, roles y seguridad)
│   ├── validations/     (Esquemas Zod de backend)
│   └── server.js        (Punto de entrada de backend)
├── frontend/
│   └── src/
│       ├── pages/       (Login, Dashboard, Users)
│       ├── stores/      (Stores globales de Zustand)
│       ├── services/    (Cliente Axios y llamadas a la API)
│       ├── components/  (Componentes UI reutilizables y layout)
│       └── validations/ (Esquemas Zod de frontend)
└── README.md
```

## Inicio Rápido

### 1. Configuración del Backend

1. Ingresa a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Crea el archivo de configuración `.env` a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
3. Edita `.env` con tus credenciales de MongoDB, claves secretas para JWT y URL del frontend.
4. Instala las dependencias y ejecuta el seed inicial para el administrador:
   ```bash
   pnpm install
   pnpm run seed          # Crea el usuario administrador por defecto
   ```
5. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```

### 2. Configuración del Frontend

1. Ingresa a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Crea el archivo de configuración `.env` a partir de la plantilla:
   ```bash
   cp .env.example .env
   ```
3. Ajusta `VITE_API_URL` si es necesario (por defecto apunta a `http://localhost:3000/api` en desarrollo gracias al proxy de Vite).
4. Instala las dependencias y corre el servidor de desarrollo:
   ```bash
   pnpm install
   pnpm run dev
   ```

## Endpoints de la API Relevantes

- `GET /api/health` — Estado y salud del servidor.
- `POST /api/auth/login` — Inicio de sesión y asignación de tokens.
- `POST /api/auth/refresh` — Refresco del token de acceso expirado.
- `GET /api/dashboard/stats` — Métricas generales (solo administradores).
- `CRUD /api/users` — Gestión completa de usuarios (requiere privilegios de administrador).
