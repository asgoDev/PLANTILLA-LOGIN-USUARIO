import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';

export default function TopBar({ onMenuToggle }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const fullName = user ? `${user.nombre} ${user.apellido}` : '';

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrador'
      : user?.role === 'usuario'
        ? 'Usuario'
        : '';

  /* Cerrar al hacer click fuera del panel */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className="flex justify-between items-center w-full px-lg h-16 sticky top-0 z-30 bg-surface shadow-sm font-montserrat">
      {/* ── Izquierda: burger + título ── */}
      <div className="flex items-center md:gap-lg">
        <button
          onClick={onMenuToggle}
          className="p-sm text-on-surface-variant hover:text-primary transition-colors md:hidden flex items-center"
        >
          <Icon name="menu" />
        </button>

        <h1 className="text-headline-sm font-headline-sm text-primary">
          Dashboard
        </h1>
      </div>

      {/* ── Derecha: Avatar + mini-modal ── */}
      <div className="relative" ref={panelRef}>
        {/* Trigger: nombre + avatar */}
        <button
          id="topbar-avatar-btn"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-sm group"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <div className="text-right hidden sm:block">
            <p className="text-label-lg text-primary font-bold leading-tight">
              {fullName}
            </p>
            <p className="text-[10px] text-on-surface-variant font-medium uppercase">
              {roleLabel}
            </p>
          </div>

          {/* Avatar con anillo animado al hover/open */}
          <span
            className={`block rounded-full transition-all duration-200
              ring-2 ring-offset-2
              ${open
                ? 'ring-primary ring-offset-surface'
                : 'ring-transparent group-hover:ring-primary/40 ring-offset-surface'
              }`}
          >
            <Avatar name={fullName} size="md" />
          </span>
        </button>

        {/* ── Mini-modal ── */}
        {open && (
          <div
            id="topbar-user-menu"
            role="menu"
            className="
              absolute right-0 top-[calc(100%+10px)]
              w-64 rounded-2xl overflow-hidden
              bg-surface border border-outline-variant
              shadow-xl
              animate-fade-in-up
            "
          >


            {/* Links de navegación */}
            <nav className="py-xs">
              <Link
                to="/perfil"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="
                  flex items-center gap-sm px-md py-sm
                  text-on-surface text-label-lg
                  hover:bg-surface-container transition-colors
                "
              >
                <Icon name="person" className="text-on-surface-variant" />
                <span>Mi perfil</span>
              </Link>

              <Link
                to="/configuracion"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="
                  flex items-center gap-sm px-md py-sm
                  text-on-surface text-label-lg
                  hover:bg-surface-container transition-colors
                "
              >
                <Icon name="settings" className="text-on-surface-variant" />
                <span>Configuración</span>
              </Link>
            </nav>

            {/* Separador + botón cerrar sesión */}
            <div className="border-t border-outline-variant py-xs">
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="
                  w-full flex items-center gap-sm px-md py-sm
                  text-error text-label-lg
                  hover:bg-error/10 transition-colors
                "
              >
                <Icon name="logout" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}