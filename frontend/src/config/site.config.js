// ═══════════════════════════════════════════════════════════════
//  site.config.js — Configuración centralizada del sitio
//  Edita SOLO este archivo para cambiar la identidad del sitio.
// ═══════════════════════════════════════════════════════════════

export const siteConfig = {
  // ─── Identidad ────────────────────────────────────────────────
  siteName: 'Mi Plantilla',
  siteTitle: 'Mi Plantilla | Panel de Control',
  siteDescription: 'Plantilla de Login y Control de Usuarios',

  // Ruta relativa al directorio /public
  favicon: '/vite.svg',

  // ─── Tema por defecto ─────────────────────────────────────────
  // Debe coincidir con un data-theme definido en index.css:
  // 'default' | 'red' | 'ocean' | 'rose' | 'slate' | 'dark' | 'midnight' | 'matrix'
  // Solo afecta a usuarios nuevos (sin selección guardada en localStorage).
  defaultTheme: 'default',

  // ─── Meta theme-color (barra de navegación en móviles) ────────
  themeColorMeta: '#006a3b',

  // ─── Tipografía ───────────────────────────────────────────────
  // Cambia fontFamily y googleFontsUrl en conjunto.
  // El link de Google Fonts se inyecta dinámicamente; no toques index.html.
  typography: {
    fontFamily: 'Montserrat',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap',
  },
};
