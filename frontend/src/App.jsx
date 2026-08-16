import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useUiStore } from './stores/uiStore';
import { siteConfig } from './config/site.config';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import UsersPage from './pages/Users/UsersPage';
import UserFormPage from './pages/Users/UserFormPage';
import AuditoriaPage from './pages/Auditoria/AuditoriaPage';

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const sessionExpiry = useAuthStore((s) => s.sessionExpiry);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    if (!isAuthenticated) return;

    const verifySession = async (silent = false) => {
      if (!sessionExpiry || Date.now() > Number(sessionExpiry)) {
        await useAuthStore.getState().logout();
        return;
      }

      checkAuth({ silent });
    };

    verifySession(false);

    const interval = setInterval(() => {
      verifySession(true);
    }, 5 * 60 * 1000);

    const handleFocus = () => {
      verifySession(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAuth, isAuthenticated]);

  // ── Identidad del sitio (corre una sola vez al montar) ──────────
  useEffect(() => {
    // Título de pestaña
    document.title = siteConfig.siteTitle;

    // Helper para crear/actualizar <meta name="...">
    const setMeta = (name, content) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };
    setMeta('description', siteConfig.siteDescription);
    setMeta('theme-color', siteConfig.themeColorMeta);

    // Favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = siteConfig.favicon;

    // Google Fonts — solo inyecta el link si no existe ya
    if (!document.querySelector(`link[href="${siteConfig.typography.googleFontsUrl}"]`)) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = siteConfig.typography.googleFontsUrl;
      document.head.appendChild(fontLink);
    }

    // Variable CSS --font-primary usada por Tailwind y main.jsx
    document.documentElement.style.setProperty(
      '--font-primary',
      `'${siteConfig.typography.fontFamily}'`
    );
  }, []);

  // ── Tema ────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isAuthenticated && isCheckingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background font-montserrat">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-16 h-16 rounded-full border-4 border-primary/30 animate-ping"></div>
          <div className="w-16 h-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <div className="absolute text-primary">
            <span className="material-symbols-outlined text-3xl font-bold fill-icon">shield_lock</span>
          </div>
        </div>
        <h2 className="text-headline-sm text-on-surface mb-2 animate-pulse">Verificando sesión</h2>
        <p className="text-body-sm text-on-surface-variant max-w-xs text-center">
          Por favor espere un momento mientras validamos sus credenciales de seguridad...
        </p>
      </div>
    );
  }


  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="usuarios/nuevo" element={<UserFormPage />} />
          <Route path="usuarios/:id" element={<UserFormPage />} />
          <Route path="auditoria" element={<AuditoriaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
