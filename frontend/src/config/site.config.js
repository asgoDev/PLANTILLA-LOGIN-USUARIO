// ═══════════════════════════════════════════════════════════════
//  site.config.js — Referencia de identidad del sitio
//
//  Este archivo documenta los valores configurables del sitio.
//  El browser los consume directamente desde index.html,
//  NO desde aquí (evita flash de tema, título y fuente).
//
//  Si cambias algo aquí, actualiza también index.html:
//    · siteTitle        → <title>
//    · siteDescription  → <meta name="description">
//    · themeColorMeta   → <meta name="theme-color">
//    · favicon          → <link rel="icon">
//    · defaultTheme     → script bloqueante (fallback del tema)
//    · typography       → <link> de Google Fonts
// ═══════════════════════════════════════════════════════════════

export const siteConfig = {
  // ─── Identidad ────────────────────────────────────────────────
  siteName: 'Mi Plantilla',
  siteTitle: 'Mi Plantilla | Panel de Control',
  siteDescription: 'Plantilla de Login y Control de Usuarios',

  // Ruta relativa al directorio /public
  favicon: '/vite.svg',

  // ─── Tema por defecto ─────────────────────────────────────────
  // Debe coincidir con el fallback del script bloqueante en index.html
  // y con un data-theme definido en index.css:
  // 'default' | 'red' | 'ocean' | 'rose' | 'slate' | 'dark' | 'midnight' | 'matrix'
  defaultTheme: 'default',

  // ─── Meta theme-color (barra de navegación en móviles) ────────
  themeColorMeta: '#006a3b',

  // ─── Tipografía ───────────────────────────────────────────────
  // Actualiza ambos valores en conjunto, y también en index.html
  typography: {
    fontFamily: 'Montserrat',
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap',
  },
};
