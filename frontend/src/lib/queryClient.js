import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos de frescura global
      gcTime: 10 * 60 * 1000,   // 10 minutos de recolección de basura
      retry: 1,                 // 1 reintento para fallos de red
      refetchOnWindowFocus: false, // Evitar refetch al enfocar la pestaña
    },
  },
});
