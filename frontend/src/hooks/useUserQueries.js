import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';

export function useUsers(page, filters = {}) {
  return useQuery({
    queryKey: ['users', 'list', { page, ...filters }],
    // Retorna el envelope completo { data: [], pagination: {} } para acceder a paginación
    queryFn: () => userService.list(page, filters).then((res) => res.data),
  });
}

export function useUserById(id) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    // Unwrap del envelope: el objeto usuario viene en res.data.data
    queryFn: () => userService.getById(id).then((res) => res.data.data),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userData) => userService.create(userData).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userService.update(id, data).then((res) => res.data.data),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // DTOs siempre usan 'id' (no '_id')
      queryClient.invalidateQueries({ queryKey: ['users', 'detail', updatedUser.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => userService.remove(id).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
