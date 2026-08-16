import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Seguir enviando cookies como fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Sincronización de refresh entre pestañas (BroadcastChannel) ──
// Cuando una pestaña renueva el token, notifica a las demás para evitar
// que intenten refrescar con el token ya invalidado (rotación estricta).
let refreshChannel = null;
try {
  refreshChannel = new BroadcastChannel('auth-refresh');
  refreshChannel.onmessage = async (event) => {
    if (event.data?.type === 'TOKEN_REFRESHED') {
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.setState({
        accessToken: event.data.accessToken,
        sessionExpiry: event.data.sessionExpiry,
        // refreshToken viaja por cookie HttpOnly, no se sincroniza por BroadcastChannel
      });
    }
    if (event.data?.type === 'LOGOUT') {
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
  };
} catch {
  // BroadcastChannel no soportado en algunos entornos (Safari < 15.4, ciertos WebViews)
}

// ── Interceptor de petición: inyectar Authorization header ──
api.interceptors.request.use(
  async (config) => {
    let accessToken = null;

    try {
      // Obtener el token de Zustand en memoria (evita latencia o bloqueos de localStorage)
      const { useAuthStore } = await import('../stores/authStore');
      accessToken = useAuthStore.getState().accessToken;
    } catch (storeError) {
      // Fallback a localStorage si la importación dinámica falla o está inicializándose
      try {
        const raw = localStorage.getItem('auth-storage');
        if (raw) {
          const parsed = JSON.parse(raw);
          accessToken = parsed?.state?.accessToken;
        }
      } catch (storageError) {
        // Ignorar fallos de lectura de localStorage
      }
    }

    // Inyectar el token de forma robusta
    if (accessToken) {
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
      } else {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de respuesta: auto-refresh del token ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es un retry ni la ruta de refresh/login/logout
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      if (isRefreshing) {
        // Encolar requests mientras se refresca
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Obtener refreshToken del store en memoria
        // (no está en localStorage para minimizar exposición XSS)
        let currentRefreshToken = null;
        try {
          const { useAuthStore } = await import('../stores/authStore');
          currentRefreshToken = useAuthStore.getState().refreshToken;
        } catch {}

        // Enviar refreshToken tanto por cookie (automático via withCredentials)
        // como por body (para iOS/cross-origin donde las cookies HttpOnly no llegan)
        // refreshToken viaja solo por cookie HttpOnly; el body solo devuelve
        // accessToken y sessionExpiry dentro del envelope { success, data: { ... } }
        const { data: envelope } = await api.post('/auth/refresh', {
          refreshToken: currentRefreshToken,
        });
        const payload = envelope.data;

        // Actualizar tokens en el store con los valores reales del servidor
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.setState({
          accessToken: payload.accessToken,
          sessionExpiry: payload.sessionExpiry,
        });

        // Notificar a otras pestañas del refresh exitoso para que no
        // intenten refrescar con el token ya invalidado
        refreshChannel?.postMessage({
          type: 'TOKEN_REFRESHED',
          accessToken: payload.accessToken,
          sessionExpiry: payload.sessionExpiry,
        });

        // Actualizar el header del request original con el nuevo token
        if (originalRequest.headers && typeof originalRequest.headers.set === 'function') {
          originalRequest.headers.set('Authorization', `Bearer ${payload.accessToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Limpiar estado de auth, notificar a otras pestañas y redirigir al login
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().clearAuth();
        refreshChannel?.postMessage({ type: 'LOGOUT' });
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
