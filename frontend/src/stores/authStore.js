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
      refreshToken: null, // Solo en memoria, NO persiste a localStorage

      login: async (identifier, password) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.login(identifier, password);
          set({
            user: data.user,
            isAuthenticated: true,
            sessionExpiry: data.sessionExpiry, // Viene del backend — única fuente de verdad
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,   // En memoria solamente
            isLoading: false,
          });
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const token = get().refreshToken;
          await authService.logout(token);
        } catch {
          // Continuar con logout local aunque falle el servidor
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            sessionExpiry: null,
            accessToken: null,
            refreshToken: null,
          });
        }
      },

      checkAuth: async ({ silent = false } = {}) => {
        if (!silent) set({ isCheckingAuth: true });
        try {
          const { data } = await authService.me();
          set({
            user: data,
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
              refreshToken: null,
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
          refreshToken: null,
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
        // refreshToken intencionalmente excluido de localStorage.
        // Solo se mantiene en memoria (se pierde al cerrar el navegador).
        // La cookie HttpOnly actúa como respaldo para renovación en el mismo dominio.
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
        accessToken: state.accessToken,
      }),
    }
  )
);
