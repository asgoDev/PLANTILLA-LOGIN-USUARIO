import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { siteConfig } from '../config/site.config';

export const useUiStore = create(
  persist(
    (set) => ({
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      theme: siteConfig.defaultTheme,
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);