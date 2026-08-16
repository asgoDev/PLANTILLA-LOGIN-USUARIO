import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: false,
      sessionExpiry: null,
      accessToken: null,
      // refreshToken ya NO se almacena en el store; viaja exclusivamente
      // por cookie HttpOnly gestionada por el servidor.

      login: async (identifier, password) => {
        set({ isLoading: true });
        try {
          // El response viene envuelto en el envelope: { success, data: { user, accessToken, sessionExpiry } }
          const { data: envelope } = await authService.login(identifier, password);
          const payload = envelope.data;
          set({
            user: payload.user,
            isAuthenticated: true,
            sessionExpiry: payload.sessionExpiry, // Viene del backend — única fuente de verdad
            accessToken: payload.accessToken,
            // refreshToken viaja por cookie HttpOnly, no se almacena aquí
            isLoading: false,
          });
          return payload;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // El refreshToken viaja por cookie HttpOnly; no se necesita enviarlo en el body
          await authService.logout();
        } catch {
          // Continuar con logout local aunque falle el servidor
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            accessToken: null,
          });
        }
      },

      checkAuth: async ({ silent = false } = {}) => {
        if (!silent) set({ isCheckingAuth: true });
        try {
          // El response viene envuelto en el envelope: { success, data: { id, nombre, ... } }
          const { data: envelope } = await authService.me();
          set({
            user: envelope.data,
            isAuthenticated: true,
            // sessionExpiry no se actualiza aquí: /auth/me no renueva tokens.
            // La sesión se extiende solo al hacer refresh explícito del token.
          });
          return true;
        } catch (error) {
          if (error.response?.status === 401) {
            set({
              user: null,
              isAuthenticated: false,
              sessionExpiry: null,
              accessToken: null,
            });
          }
          return false;
        } finally {
          if (!silent) set({ isCheckingAuth: false });
        }
      },

      clearAuth: () => {
        set({
          user: null,
          isAuthenticated: false,
          sessionExpiry: null,
          accessToken: null,
        });
      },

      // Actualiza sessionExpiry y tokens tras un refresh exitoso.
      // Llamado por el interceptor de Axios con los datos devueltos por el servidor.
      setSessionExpiry: (expiry) => {
        set({ sessionExpiry: expiry });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // refreshToken excluido: viaja exclusivamente por cookie HttpOnly.
        // La cookie actúa como respaldo para renovación en el mismo dominio.
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
        accessToken: state.accessToken,
      }),
    }
  )
);
