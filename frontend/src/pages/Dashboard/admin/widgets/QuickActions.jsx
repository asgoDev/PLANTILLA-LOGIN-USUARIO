import { Link } from 'react-router-dom';
import Icon from '../../../../components/ui/Icon';

const adminActions = [
  {
    icon: 'person_add',
    title: 'Nuevo usuario',
    desc: 'Registrar cuenta (solo admin)',
    path: '/usuarios/nuevo',
  },
  {
    icon: 'group',
    title: 'Gestionar usuarios',
    desc: 'Listado y edición',
    path: '/usuarios',
  },
  {
    icon: 'account_circle',
    title: 'Mi perfil',
    desc: 'Datos de sesión actual',
    path: '/',
  },
  {
    icon: 'shield',
    title: 'Auditoría',
    desc: 'Registro de acciones del sistema',
    path: '/auditoria',
  },
];

/**
 * QuickActions
 *
 * Acciones rápidas específicas del administrador.
 */
export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
      {adminActions.map((action) => (
        <Link
          key={action.title}
          to={action.path}
          className="bg-surface-container-lowest p-lg rounded-xl shadow-sm border border-outline-variant/10 
                     hover:shadow-md hover:border-primary/20 transition-all text-left group cursor-pointer"
        >
          <div
            className="w-10 h-10 rounded-lg bg-primary-container/10 text-primary flex items-center justify-center mb-3
                        group-hover:bg-primary group-hover:text-white transition-colors"
          >
            <Icon name={action.icon} />
          </div>
          <h4 className="text-label-lg font-bold text-on-surface">{action.title}</h4>
          <p className="text-label-sm text-on-surface-variant mt-1">{action.desc}</p>
        </Link>
      ))}
    </div>
  );
}
