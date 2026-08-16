# Guía de API y Estructura de Carpetas del Backend

Esta guía sirve como referencia para la integración del frontend con el backend del proyecto.

---

## 📂 Estructura de Carpetas (Backend)

La estructura de directorios de la carpeta `backend/` está organizada bajo patrones limpios y modulares (Clean Architecture / Inyección de Dependencias):

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
│   │   │   ├── auditoria.repository.js
│   │   │   ├── auditoria.routes.js
│   │   │   └── auditoria.service.js
│   │   │
│   │   ├── auth/                   # Autenticación (Login, refresh, logout, me)
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.model.js
│   │   │   ├── auth.repository.js
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
│   │       ├── user.repository.js
│   │       ├── user.routes.js
│   │       ├── user.service.js
│   │       └── user.validation.js
│   │
│   ├── shared/                     # Código compartido, middlewares y DTOs
│   │   ├── dtos/                   # Capa DTO (Data Transfer Objects & Contratos de respuesta)
│   │   │   ├── auditoria.dto.js    # Mapeo toAuditoriaDTO / toAuditoriaListDTO
│   │   │   ├── dashboard.dto.js    # Mapeo toDashboardStatsDTO
│   │   │   ├── response.dto.js     # Envoltorios successResponse / paginatedResponse
│   │   │   └── user.dto.js         # Mapeo toUserDTO / toSessionUserDTO / toUserListDTO
│   │   ├── errors/                 # Clases de errores personalizadas (AppError)
│   │   └── middleware/             # Middlewares (auth, audit, rate limiter, errorHandler, validate)
│   │
│   ├── container.js                # Contenedor de Inyección de Dependencias
│   └── server.js                   # Punto de entrada de la aplicación Express
│
├── .env.example                    # Plantilla de variables de entorno
├── package.json                    # Dependencias y scripts npm/pnpm
├── request.http                    # Archivo de pruebas rápidas (VS Code REST Client)
└── pnpm-workspace.yaml             # Configuración de monorepo si aplica
```

---

## 📦 Contrato Estándar de Respuestas (Response Envelope)

Todas las respuestas exitosas de la API siguen un formato consistente:

### Respuesta Simple
```json
{
  "success": true,
  "message": "Operación realizada con éxito",
  "data": { ... }
}
```

### Respuesta Paginada
```json
{
  "success": true,
  "message": null,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "message": "Mensaje descriptivo del error",
  "code": "ERROR_CODE",
  "errors": [ ... ]
}
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
      "timestamp": "2026-06-17T14:30:00.000Z"
    }
    ```

---

### 🔐 Autenticación (`/api/auth`)

#### 1. Iniciar Sesión (Login)
*   **Endpoint:** `POST /auth/login`
*   **Descripción:** Autentica a un usuario y retorna tokens y datos de sesión.
*   **Limiter:** Sujeto a límites de intentos.
*   **Body (JSON):**
    *   `identifier` (string, requerido): Cédula (ej. `V-26266384`) o Correo Electrónico.
    *   `password` (string, requerido): Mínimo 6 caracteres.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "message": "Inicio de sesión exitoso",
      "data": {
        "user": {
          "id": "66704b281f9b3e1a4c8e7d21",
          "nombre": "Jesus",
          "apellido": "Lopez",
          "email": "correo@correo.com",
          "role": "admin"
        },
        "accessToken": "eyJhbG...",
        "sessionExpiry": 1718635500000
      }
    }
    ```

#### 2. Renovar Token (Refresh)
*   **Endpoint:** `POST /auth/refresh`
*   **Descripción:** Obtiene un nuevo `accessToken` usando un `refreshToken` válido (en cookie o body).
*   **Body (JSON):**
    *   `refreshToken` (string, opcional si viaja en cookie).
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "message": "Token renovado exitosamente",
      "data": {
        "accessToken": "eyJhbG...",
        "sessionExpiry": 1718635500000
      }
    }
    ```

#### 3. Cerrar Sesión (Logout)
*   **Endpoint:** `POST /auth/logout`
*   **Descripción:** Invalida el `refreshToken` en la blacklist del backend y limpia cookies.
*   **Headers:** `Authorization: Bearer <accessToken>` (o cookie activa).
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "message": "Sesión cerrada exitosamente",
      "data": null
    }
    ```

#### 4. Obtener Datos del Usuario Actual (Me)
*   **Endpoint:** `GET /auth/me`
*   **Descripción:** Obtiene los datos del perfil del usuario actualmente autenticado.
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "66704b281f9b3e1a4c8e7d21",
        "nombre": "Jesus",
        "apellido": "Lopez",
        "email": "correo@correo.com",
        "role": "admin"
      }
    }
    ```

---

### 👥 Gestión de Usuarios (`/api/users`)
> ⚠️ **Nota:** Todos los endpoints de usuarios requieren cabecera `Authorization: Bearer <accessToken>` y rol **admin**.

#### 1. Listar Usuarios (con paginación y filtros)
*   **Endpoint:** `GET /users`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Parámetros de Query (Opcionales):**
    *   `page` (number, default: 1)
    *   `limit` (number, default: 20)
    *   `role` (string: `admin` | `usuario`)
    *   `estado` (string: `activo` | `inactivo`)
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "66704b281f9b3e1a4c8e7d21",
          "nombre": "Jesus",
          "apellido": "Lopez",
          "cedula": "V-26266384",
          "fechaNacimiento": "1995-05-15T00:00:00.000Z",
          "email": "correo@correo.com",
          "role": "admin",
          "estado": "activo",
          "telefono": "0412-1234567",
          "direccion": "Calle Principal #1",
          "createdAt": "2026-06-17T14:30:00.000Z",
          "updatedAt": "2026-06-17T14:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 20,
        "pages": 1
      }
    }
    ```

#### 2. Obtener Usuario por ID
*   **Endpoint:** `GET /users/:id`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "id": "66704b281f9b3e1a4c8e7d21",
        "nombre": "Jesus",
        "apellido": "Lopez",
        "cedula": "V-26266384",
        "fechaNacimiento": "1995-05-15T00:00:00.000Z",
        "email": "correo@correo.com",
        "role": "admin",
        "estado": "activo",
        "telefono": "0412-1234567",
        "direccion": "Calle Principal #1",
        "createdAt": "2026-06-17T14:30:00.000Z",
        "updatedAt": "2026-06-17T14:30:00.000Z"
      }
    }
    ```

#### 3. Crear Nuevo Usuario
*   **Endpoint:** `POST /users`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Body (JSON):**
    *   `nombre` (string, requerido): Mínimo 1, máx 50 carácteres.
    *   `apellido` (string, requerido): Mínimo 1, máx 50 carácteres.
    *   `cedula` (string, requerido): Formato regex (`V-12345678` o `E-12345678`).
    *   `fechaNacimiento` (string, requerido): Formato `YYYY-MM-DD` (>= 18 años).
    *   `email` (string, requerido): Correo electrónico válido.
    *   `password` (string, requerido): Mínimo 8 caracteres (mayúscula, minúscula, número).
    *   `role` (string, opcional): `admin` | `usuario` (default: `usuario`).
    *   `telefono` (string, opcional): Formato `04XX-XXXXXXX` o `02XX-XXXXXXX`.
    *   `direccion` (string, opcional): Máximo 200 caracteres.
    *   `estado` (string, opcional): `activo` | `inactivo`.
*   **Respuesta Exitosa (201 Created):**
    ```json
    {
      "success": true,
      "message": "Usuario creado exitosamente",
      "data": {
        "id": "66704b281f9b3e1a4c8e7d22",
        "nombre": "Pedro",
        "apellido": "Perez",
        "cedula": "V-12345678",
        "fechaNacimiento": "1998-03-20T00:00:00.000Z",
        "email": "pedro@correo.com",
        "role": "usuario",
        "estado": "activo",
        "telefono": "0414-7654321",
        "direccion": "Av. Bolívar",
        "createdAt": "2026-06-17T14:35:00.000Z",
        "updatedAt": "2026-06-17T14:35:00.000Z"
      }
    }
    ```

#### 4. Actualizar Usuario
*   **Endpoint:** `PUT /users/:id`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Body (JSON):** Campos a actualizar (la cédula no se puede modificar).
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "message": "Usuario actualizado exitosamente",
      "data": {
        "id": "66704b281f9b3e1a4c8e7d22",
        "nombre": "Pedro",
        "apellido": "Perez Modificado",
        "cedula": "V-12345678",
        "fechaNacimiento": "1998-03-20T00:00:00.000Z",
        "email": "pedro@correo.com",
        "role": "usuario",
        "estado": "activo",
        "telefono": "0414-7654321",
        "direccion": "Nueva dirección",
        "createdAt": "2026-06-17T14:35:00.000Z",
        "updatedAt": "2026-06-17T14:40:00.000Z"
      }
    }
    ```

#### 5. Eliminar (Desactivar) Usuario (Soft Delete)
*   **Endpoint:** `DELETE /users/:id`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Descripción:** Desactiva al usuario (cambia su estado a `inactivo`). Un administrador no puede desactivar su propia cuenta.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "message": "Usuario desactivado exitosamente",
      "data": {
        "id": "66704b281f9b3e1a4c8e7d22",
        "nombre": "Pedro",
        "apellido": "Perez",
        "cedula": "V-12345678",
        "fechaNacimiento": "1998-03-20T00:00:00.000Z",
        "email": "pedro@correo.com",
        "role": "usuario",
        "estado": "inactivo",
        "telefono": "0414-7654321",
        "direccion": "Nueva dirección",
        "createdAt": "2026-06-17T14:35:00.000Z",
        "updatedAt": "2026-06-17T14:45:00.000Z"
      }
    }
    ```

---

### 📊 Dashboard (`/api/dashboard`)

#### 1. Obtener Estadísticas
*   **Endpoint:** `GET /dashboard/stats`
*   **Descripción:** Retorna métricas generales de usuarios y auditoría.
*   **Headers:** `Authorization: Bearer <accessToken>` (rol: `admin`)
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "usersCount": 15,
        "activeUsersCount": 12,
        "inactiveUsersCount": 3,
        "auditCount": 140
      }
    }
    ```

---

### 🔍 Auditoría (`/api/auditoria`)
> ⚠️ **Nota:** Requiere rol **admin**.

#### 1. Consultar Logs de Auditoría
*   **Endpoint:** `GET /auditoria`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Parámetros de Query (Opcionales):**
    *   `page` (number, default: 1)
    *   `limit` (number, default: 50, máx: 100)
    *   `usuario_id` (string): ID del usuario o término de búsqueda.
    *   `modulo` (string): Ej. `USERS`, `AUTH`
    *   `accion` (string): Ej. `CREAR`, `MODIFICAR`, `LOGIN`, `CERRAR_SESION`
    *   `resultado` (string): `EXITOSO` | `FALLIDO`
    *   `desde` (string ISO): Inicio del rango de fechas.
    *   `hasta` (string ISO): Fin del rango de fechas.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "66704c101f9b3e1a4c8e7d99",
          "modulo": "USERS",
          "accion": "CREAR",
          "resultado": "EXITOSO",
          "statusCode": 201,
          "metodo": "POST",
          "url": "/api/users",
          "recurso_id": "66704b281f9b3e1a4c8e7d22",
          "usuario": {
            "id": "66704b281f9b3e1a4c8e7d21",
            "nombre": "Jesus",
            "apellido": "Lopez",
            "email": "correo@correo.com",
            "cedula": "V-26266384"
          },
          "ip": "::1",
          "userAgent": "Mozilla/5.0...",
          "detalles": {
            "body": { ... }
          },
          "fecha": "2026-06-17T14:35:00.000Z"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 50,
        "pages": 1
      }
    }
    ```

#### 2. Obtener Lista de Módulos Registrados
*   **Endpoint:** `GET /auditoria/modules`
*   **Headers:** `Authorization: Bearer <accessToken>`
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "success": true,
      "data": ["AUTH", "USERS", "DASHBOARD"]
    }
    ```

