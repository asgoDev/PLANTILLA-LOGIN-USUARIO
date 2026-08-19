import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/authStore';

export function useDashboardStats() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['dashboard', 'stats', user?.id || 'guest'],
    // Unwrap del envelope: las estadísticas vienen en res.data.data
    queryFn: () => dashboardService.getStats().then((res) => res.data.data),
    staleTime: 3 * 60 * 1000, // 3 minutos de frescura en el navegador
    gcTime: 10 * 60 * 1000,   // 10 minutos en memoria de TanStack
  });
}
