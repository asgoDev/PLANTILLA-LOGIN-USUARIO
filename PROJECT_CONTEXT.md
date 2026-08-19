# Contexto del Proyecto: Plantilla Login & Control de Usuarios

Documento de referencia para poner en contexto a modelos de lenguaje (LLMs) o desarrolladores sobre la estructura, arquitectura, APIs y convenciones de este proyecto.

---

## 1. Visión General del Proyecto

Es una **plantilla base Full-Stack** para sistemas web con:
- **Autenticación robusta**: JWT (Access Token + Refresh Token).
- **Control de Acceso basado en Roles (RBAC)**: Roles `admin` y `usuario`.
- **Panel Administrativo CRUD**: Gestión completa de usuarios (creación, edición, listado paginado, soft-delete).
- **Sistema de Auditoría**: Registro centralizado de logs de acciones/eventos del sistema.
- **Dashboard de Métricas**: Estadísticas en tiempo real.
- **Interfaz Moderna**: React + Tailwind CSS con soporte para temas (Light/Dark).

---

## 2. Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Backend** | Node.js (ES Modules), Express 4, Mongoose 8 (MongoDB), Zod (validación), Bcrypt, Jwt |
| **Frontend** | React 18, Vite, Tailwind CSS, Zustand (estado global), React Router v6 |
| **Seguridad** | Helmet, Express Rate Limit (+ Redis Store), Mongo Sanitization, Cors, Token Blacklist |
| **Cache** | Redis (ioredis) — opcional con graceful degradation. Token blacklist, dashboard stats, sesión de usuario |
| **Paquetes / Monorepo** | PNPM Workspaces |

---

## 3. Arquitectura y Estructura del Código

### Backend (`/backend`)
Organizado con **Clean Architecture / Inyección de Dependencias manual** (`backend/src/container.js`).

```text
backend/
├── src/
│   ├── container.js              # Contenedor DI (conecta Repos -> Services -> Controllers -> Routes)
│   ├── server.js                 # Express App & punto de entrada
│   │
│   ├── infrastructure/           # Adaptadores externos
│   │   ├── database/db.js        # Conexión MongoDB (Mongoose)
│   │   ├── jwt/jwt.utils.js      # Firma y verificación de Access/Refresh Tokens
│   │   └── redis/
│   │       ├── redis.client.js   # Conexión Redis (ioredis) con graceful degradation
│   │       └── cache.service.js  # Servicio genérico de cache (get/set/del/exists)
│   │
│   ├── modules/                  # Módulos de dominio
│   │   ├── auth/                 # Login, refresh, logout, me (controller, service, repository, validation)
│   │   ├── users/                # CRUD de usuarios (controller, service, repository, model, validation)
│   │   ├── auditoria/            # Logs de sistema (controller, service, repository, model)
│   │   └── dashboard/            # Métricas (controller, service)
│   │
│   └── shared/                   # Compartido
│       ├── dtos/                 # Data Transfer Objects (user, auditoria, dashboard, response)
│       ├── errors/               # Clases de error (AppError, UnauthorizedError, ValidationError, etc.)
│       └── middleware/           # auth.middleware, audit.middleware, rateLimiter, errorHandler, validate.middleware
```

**Flujo Backend**: `Route` ➔ `Validation Middleware (Zod)` ➔ `Controller` ➔ `Service` ➔ `Repository` ➔ `Mongoose Model` ➔ `DTO (Transformación)` ➔ `Response Envelope`.

### Frontend (`/frontend`)
Estructurado por páginas, componentes de UI/Layout, servicios API y Zustand stores.

```text
frontend/
├── src/
│   ├── App.jsx                   # Verificación de sesión e itinerario de rutas (React Router)
│   ├── main.jsx                  # Punto de entrada de React
│   ├── components/               # Layouts (AppLayout, ProtectedRoute, Sidebar, Header) y componentes UI
│   ├── pages/                    # Páginas principales: Login, Dashboard, Users (list & form), Auditoria, NotFound
│   ├── stores/                   # Zustand: authStore.js, uiStore.js, userStore.js, auditoriaStore.js
│   ├── services/                 # Llamadas HTTP con Axios/Fetch a la API backend
│   └── validations/              # Esquemas Zod para formularios del cliente
```

---

## 4. Modelos de Datos Principales

### 1. Usuario (`User`)
- `nombre` (String, req)
- `apellido` (String, req)
- `cedula` (String, req, único, inmutable tras creación, formato regex: `^[VE]-\d{5,9}$`)
- `fechaNacimiento` (Date, req, validación >= 18 años)
- `email` (String, req, único, formato email)
- `password` (String, req, hashed con Bcrypt)
- `role` (Enum: `'admin'`, `'usuario'`, default `'usuario'`)
- `telefono` (String, opcional)
- `direccion` (String, opcional)
- `estado` (Enum: `'activo'`, `'inactivo'`, default `'activo'`)

*Reglas de Negocio*:
- Soft delete: `DELETE /api/users/:id` establece `estado = 'inactivo'`.
- Un usuario `admin` no puede desactivarse a sí mismo.
- La cédula no se puede editar después de crear el registro.

### 2. Auditoría (`Auditoria`)
- `modulo` (String, ej. `'AUTH'`, `'USERS'`)
- `accion` (String, ej. `'LOGIN'`, `'CREAR'`, `'MODIFICAR'`, `'ELIMINAR'`)
- `usuario` (ObjectId ref User, opcional)
- `detalles` (Object / String)
- `resultado` (Enum: `'EXITOSO'`, `'FALLIDO'`)
- `ip` (String)
- `timestamp` (Date, default `Date.now`)

---

## 5. Endpoints de la API

Base URL: `http://localhost:5000/api` (o según variable `.env`).

| Método | Endpoint | Middleware / Auth | Descripción |
|---|---|---|---|
| `GET` | `/health` | Público | Estado del servidor y uptime |
| `POST` | `/auth/login` | Público + Rate Limit | Iniciar sesión (Cédula o Email + Password) |
| `POST` | `/auth/refresh` | Público | Renovar Access Token usando Refresh Token |
| `POST` | `/auth/logout` | Autenticado | Invalida el Refresh Token |
| `GET` | `/auth/me` | Autenticado | Devuelve perfil del usuario actual |
| `GET` | `/users` | Autenticado (`admin`) | Listado paginado y filtrado de usuarios |
| `GET` | `/users/:id` | Autenticado (`admin`) | Obtener usuario por ID |
| `POST` | `/users` | Autenticado (`admin`) | Crear nuevo usuario |
| `PUT` | `/users/:id` | Autenticado (`admin`) | Actualizar usuario existente |
| `DELETE`| `/users/:id` | Autenticado (`admin`) | Desactivar usuario (soft-delete) |
| `GET` | `/dashboard/stats` | Autenticado (`admin`) | Estadísticas de usuarios y eventos |
| `GET` | `/auditoria` | Autenticado (`admin`) | Consultar logs de auditoría paginados |

---

## 6. Variables de Entorno (.env)

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/plantilla_login
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_REFRESH_SECRET=tu_jwt_refresh_secret_super_seguro
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Instrucciones para Ejecutar y Probar

### Requisitos
- Node.js >= 18
- MongoDB corriendo localmente o URI remota
- PNPM (recomendado) o NPM

### Paso 1: Configurar e Iniciar Backend
```bash
cd backend
cp .env.example .env
pnpm install
pnpm run seed    # Crea usuario admin por defecto (Cédula: V-00000000, Pass: Admin123!)
pnpm run dev     # Inicia en http://localhost:5000
```

### Paso 2: Configurar e Iniciar Frontend
```bash
cd frontend
cp .env.example .env
pnpm install
pnpm run dev     # Inicia Vite en http://localhost:5173
```

---

## 8. Guía para Agregar Nuevas Funcionalidades (Para LLMs / Devs)

Al expandir o modificar esta plantilla, sigue el patrón del proyecto:

1. **Nuevo Módulo Backend**:
   - Crear subcarpeta en `backend/src/modules/nombre-modulo/`.
   - Definir `nombre.model.js` (Mongoose), `nombre.repository.js`, `nombre.service.js`, `nombre.controller.js`, `nombre.routes.js` y `nombre.validation.js` (Zod).
   - Registrar las instancias en `backend/src/container.js`.
   - Montar las rutas en `backend/src/server.js`.

2. **Nuevo Módulo Frontend**:
   - Agregar servicios HTTP en `frontend/src/services/`.
   - Si requiere estado global, crear una store Zustand en `frontend/src/stores/`.
   - Crear componentes de página en `frontend/src/pages/`.
   - Registrar las rutas correspondientes en `frontend/src/App.jsx`.

---

## 9. Implementaciones Futuras Pendientes

### 🔮 Fase 3: Política de Retención TTL / Archivado de Auditoría (Hallazgo H-06)

> **Estado:** ⏳ Pendiente — Se implementará cuando la infraestructura y la demanda del sistema lo requieran.

**Problema:** La colección `auditorias` en MongoDB crece indefinidamente. Sin una política de retención, el almacenamiento aumentará progresivamente y las consultas sobre datos históricos pueden degradarse en rendimiento a largo plazo.

**Solución Propuesta (para implementar en el futuro):**

1. **Índice TTL en MongoDB**: Agregar un índice TTL en el campo `fecha` del modelo `Auditoria` para que MongoDB elimine automáticamente los documentos más antiguos que un periodo configurable (ej. 90 o 180 días).
   ```javascript
   // En auditoria.model.js
   auditoriaSchema.index({ fecha: 1 }, { expireAfterSeconds: 7776000 }); // 90 días
   ```

2. **Archivado previo a la purga (opcional)**: Antes de que los documentos expiren, exportarlos a un almacenamiento de menor costo (archivos JSON comprimidos, S3, etc.) mediante un cron job o tarea programada.

3. **Variable de entorno configurable**: Permitir definir el TTL desde `.env`:
   ```env
   AUDIT_RETENTION_DAYS=90
   ```

4. **Panel de configuración (opcional)**: Agregar una sección en el panel admin para visualizar estadísticas de almacenamiento de auditoría y configurar la retención.

**Motivo de aplazamiento:** El sistema actual no maneja suficiente volumen de datos ni dispone de infraestructura de servidores que justifique la implementación inmediata. Se priorizará cuando:
- La colección `auditorias` supere los 100.000 documentos.
- Se detecte degradación en tiempos de consulta.
- Se migre a una infraestructura con mayor capacidad.

**Referencia:** Ver [AUDIT_ANALYSIS_REPORT.md](file:///c:/Users/AsgoDev/Desktop/Proyectos/AsgoDev/PLANTILLA%20LOGIN-USUARIO/AUDIT_ANALYSIS_REPORT.md), Hallazgo **H-06** (Gravedad 🟡 Media).
