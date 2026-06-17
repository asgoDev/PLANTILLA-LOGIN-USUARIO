# Guía de API y Estructura de Carpetas del Backend

Esta guía sirve como referencia para la integración del frontend con el backend del proyecto.

---

## 📂 Estructura de Carpetas (Backend)

La estructura de directorios de la carpeta `backend/` está organizada bajo patrones limpios y modulares (cercanos a clean architecture):

```text
backend/
├── src/
│   ├── infrastructure/             # Configuración de servicios externos e infraestructura
│   │   ├── database/
│   │   │   └── db.js               # Conexión a MongoDB (Mongoose)
│   │   └── jwt/                    # Proveedores y configs de JWT (tokens de acceso/refresh)
│   │
│   ├── modules/                    # Módulos de dominio y lógica de negocio
│   │   ├── auditoria/              # Logs de auditoría
│   │   │   ├── auditoria.controller.js
│   │   │   ├── auditoria.model.js
│   │   │   ├── auditoria.routes.js
│   │   │   └── auditoria.service.js
│   │   │
│   │   ├── auth/                   # Autenticación (Login, refresh, logout, me)
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.model.js
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.validation.js
│   │   │
│   │   ├── dashboard/              # Estadísticas e información del dashboard
│   │   │   ├── dashboard.controller.js
│   │   │   ├── dashboard.routes.js
│   │   │   └── dashboard.service.js
│   │   │
│   │   └── users/                  # Gestión de usuarios
│   │       ├── user.controller.js
│   │       ├── user.model.js
│   │       ├── user.routes.js
│   │       ├── user.service.js
│   │       └── user.validation.js
│   │
│   ├── shared/                     # Código compartido y middlewares globales
│   │   ├── errors/                 # Clases de errores personalizadas
│   │   ├── middleware/             # Middlewares (autenticación, rate limiter, auditoría, manejo de errores, validaciones)
│   │
│   └── server.js                   # Punto de entrada de la aplicación Express
│
├── .env.example                    # Plantilla de variables de entorno
├── package.json                    # Dependencias y scripts npm/pnpm
├── request.http                    # Archivo de pruebas rápidas (VS Code REST Client)
└── pnpm-workspace.yaml             # Configuración de monorepo si aplica
```

---

## 🌐 Endpoints de la API

La URL base de la API es `http://localhost:5000/api` (o la configurada en tu entorno).

### 🏥 Health Check
*   **Endpoint:** `GET /health`
*   **Descripción:** Verifica el estado general del servidor.
*   **Autenticación:** No requiere.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "status": "ok",
      "timestamp": "2026-06-17T14:30:00.000Z",
      "uptime": 124.5
    }
    ```

---

### 🔐 Autenticación (`/api/auth`)

#### 1. Iniciar Sesión (Login)
*   **Endpoint:** `POST /auth/login`
*   **Descripción:** Autentica a un usuario y retorna los tokens de acceso y refresco.
*   **Limiter:** Sujeto a límites de intentos.
*   **Body (JSON):**
    *   `identifier` (string, requerido): Cédula (ej. `V-26266384`) o Correo Electrónico. Valida formato regex.
    *   `password` (string, requerido): Mínimo 6 caracteres.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "user": {
        "_id": "...",
        "nombre": "Jesus",
        "apellido": "Lopez",
        "cedula": "V-26266384",
        "email": "correo@correo.com",
        "role": "admin"
      }
    }
    ```

#### 2. Renovar Token (Refresh)
*   **Endpoint:** `POST /auth/refresh`
*   **Descripción:** Obtiene un nuevo `accessToken` usando un `refreshToken` válido.
*   **Body (JSON):**
    *   `refreshToken` (string, requerido).
*   **Respuesta Exitosa (200 OK):** Retorna un nuevo par de tokens.

#### 3. Cerrar Sesión (Logout)
*   **Endpoint:** `POST /auth/logout`
*   **Descripción:** Invalida el `refreshToken` en el backend.
*   **Body (JSON):**
    *   `refreshToken` (string, requerido).
*   **Respuesta Exitosa (200 OK):** Mensaje de éxito.

#### 4. Obtener Datos del Usuario Actual (Me)
*   **Endpoint:** `GET /auth/me`
*   **Descripción:** Obtiene los datos del perfil del usuario actualmente autenticado mediante el token.
*   **Headers:**
    *   `Authorization: Bearer <accessToken>`
*   **Respuesta Exitosa (200 OK):** Datos del usuario.

---

### 👥 Gestión de Usuarios (`/api/users`)
> ⚠️ **Nota:** Todos los endpoints de usuarios requieren cabecera `Authorization: Bearer <accessToken>` y rol **admin**.

#### 1. Listar Usuarios (con paginación y filtros)
*   **Endpoint:** `GET /users`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Parámetros de Query (Opcionales):**
    *   `page` (number, default: 1)
    *   `limit` (number, default: 10)
    *   `role` (string: `admin` | `usuario`)
    *   `estado` (string: `activo` | `inactivo`)
*   **Respuesta Exitosa (200 OK):** Lista paginada de usuarios.

#### 2. Obtener Usuario por ID
*   **Endpoint:** `GET /users/:id`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Parámetros de Ruta:**
    *   `id` (string, requerido): ID del usuario de MongoDB.

#### 3. Crear Nuevo Usuario
*   **Endpoint:** `POST /users`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Body (JSON):**
    *   `nombre` (string, requerido): Mínimo 1, máx 50 carácteres.
    *   `apellido` (string, requerido): Mínimo 1, máx 50 carácteres.
    *   `cedula` (string, requerido): Formato regex (ej: `V-12345678` o `E-12345678`).
    *   `fechaNacimiento` (string, requerido): Formato `YYYY-MM-DD`. Debe ser mayor de edad (>= 18 años).
    *   `email` (string, requerido): Correo electrónico válido.
    *   `password` (string, requerido): Mínimo 8 caracteres.
    *   `role` (string, opcional): `admin` | `usuario` (por defecto `usuario`).
    *   `telefono` (string, opcional): Formato regex (ej: `0412-1234567` o `0212-1234567`).
    *   `direccion` (string, opcional): Máximo 200 caracteres.
    *   `estado` (string, opcional): `activo` | `inactivo`.

#### 4. Actualizar Usuario
*   **Endpoint:** `PUT /users/:id`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Parámetros de Ruta:**
    *   `id` (string, requerido).
*   **Body (JSON):** Todos los campos de la creación son opcionales aquí. No se permite cambiar la cédula una vez creado. Debe enviarse al menos un campo a modificar.

#### 5. Eliminar (Desactivar) Usuario (Soft Delete)
*   **Endpoint:** `DELETE /users/:id`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Descripción:** Desactiva al usuario (cambia su estado a `inactivo`). Un administrador no puede desactivar su propia cuenta.

---

### 📊 Dashboard (`/api/dashboard`)

#### 1. Obtener Estadísticas
*   **Endpoint:** `GET /dashboard/stats`
*   **Descripción:** Retorna métricas generales (conteos de usuarios activos/inactivos, etc.).
*   **Headers:** `Authorization: Bearer <accessToken>`

---

### 🔍 Auditoría (`/api/auditoria`)
> ⚠️ **Nota:** Requiere rol **admin**.

#### 1. Consultar Logs de Auditoría
*   **Endpoint:** `GET /auditoria`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Parámetros de Query (Opcionales):**
    *   `page` (number, default: 1)
    *   `limit` (number, default: 10)
    *   `modulo` (string): Ej. `USERS`, `AUTH`
    *   `accion` (string): Ej. `CREAR`, `MODIFICAR`, `LOGIN`, `CERRAR_SESION`
    *   `resultado` (string): `EXITOSO` | `FALLIDO`
*   **Respuesta Exitosa (200 OK):** Lista paginada con los logs de auditoría.
