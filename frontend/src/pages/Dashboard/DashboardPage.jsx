import { useAuthStore } from '../../stores/authStore';
import Icon from '../../components/ui/Icon';
import AdminDashboard from './admin/AdminDashboard';
import DashboardUnavailable from './shared/DashboardUnavailable';

const dashboardByRole = {
  admin: AdminDashboard,
  // Futuros roles:
  // barbero: BarberoDashboard,
};

/**
 * Sección Hero compartida entre todos los dashboards
 */
function HeroSection({ user }) {
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="bg-gradient-to-r from-primary to-primary-container rounded-xl p-8 text-white shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-body-md text-white/80 mb-1">{greeting()},</p>
          <h1 className="text-headline-lg font-headline-lg mb-2">
            {user?.nombre} {user?.apellido}
          </h1>
          <p className="text-body-md text-white/70 max-w-lg">
            Bienvenido a la plantilla full-stack con autenticación JWT, gestión de usuarios y
            auditoría de acciones.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white/15 px-4 py-2 rounded-lg backdrop-blur-sm">
          <Icon name="verified_user" size="20px" />
          <span className="text-label-lg font-bold uppercase">{user?.role}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * DashboardPage
 *
 * Enrutador de dashboard por rol. Selecciona y renderiza el componente adecuado
 * según el rol del usuario autenticado sin lógica condicional en la capa de vista.
 */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const RoleDashboard = dashboardByRole[role];

  return (
    <div className="space-y-lg animate-fade-in-up">
      <HeroSection user={user} />
      {RoleDashboard ? <RoleDashboard /> : <DashboardUnavailable role={role} />}
    </div>
  );
}
