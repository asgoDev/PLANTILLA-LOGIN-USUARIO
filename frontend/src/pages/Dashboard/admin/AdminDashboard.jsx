import { useDashboardStats } from '../../../hooks/useDashboardQueries';
import UsersStatsCard from './widgets/UsersStatsCard';
import AuditStatsCard from './widgets/AuditStatsCard';
import QuickActions from './widgets/QuickActions';

/**
 * AdminDashboard
 *
 * Vista principal del dashboard para usuarios con rol 'admin'.
 */
export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <UsersStatsCard data={stats} isLoading={isLoading} />
        <AuditStatsCard data={stats} isLoading={isLoading} />
      </div>

      <QuickActions />
    </div>
  );
}
