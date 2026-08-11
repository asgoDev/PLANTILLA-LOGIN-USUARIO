import { useQuery } from '@tanstack/react-query';
import { auditoriaService } from '../services/auditoriaService';

export function useAuditoriaLogs(page, filters = {}) {
  return useQuery({
    queryKey: ['auditoria', 'logs', { page, ...filters }],
    queryFn: () => auditoriaService.getLogs(page, filters).then((res) => res.data),
    staleTime: 1 * 60 * 1000, // 1 minuto para logs de auditoría
  });
}

export function useAuditoriaModules() {
  return useQuery({
    queryKey: ['auditoria', 'modules'],
    queryFn: () => auditoriaService.getModules().then((res) => res.data.modules),
    staleTime: 10 * 60 * 1000, // 10 minutos — los módulos rara vez cambian
  });
}
