import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const jabatanKeys = {
  all: ['jabatans'],
  lists: () => [...jabatanKeys.all, 'list'],
  list: (filters) => [...jabatanKeys.lists(), filters],
  details: () => [...jabatans.all, 'detail'],
  detail: (id) => [...jabatanKeys.details(), id],
  dropdown: () => [...jabatanKeys.all, 'dropdown'],
  statistics: () => [...jabatanKeys.all, 'statistics'],
};

export const jabatanKeysFixed = {
  all: ['jabatans'],
  lists: () => [...jabatanKeysFixed.all, 'list'],
  list: (filters) => [...jabatanKeysFixed.lists(), filters],
  details: () => [...jabatanKeysFixed.all, 'detail'],
  detail: (id) => [...jabatanKeysFixed.details(), id],
  dropdown: () => [...jabatanKeysFixed.all, 'dropdown'],
  statistics: () => [...jabatanKeysFixed.all, 'statistics'],
};

// Gunakan yang fixed
export const jabatanKeysFinal = jabatanKeysFixed;

export const useJabatans = (params = {}) => {
  const { search = '', with_count = true, perPage = 10, page = 1 } = params;

  return useQuery({
    queryKey: jabatanKeysFinal.list({ search, with_count, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/jabatans', {
        params: {
          search: search || undefined,
          with_count,
          per_page: perPage,
          page,
        },
      });

      return {
        jabatans: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJabatansDropdown = () => {
  return useQuery({
    queryKey: jabatanKeysFinal.dropdown(),
    queryFn: async () => {
      const response = await api.get('/jabatans/dropdown');
      return response.data.data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
};

export const useJabatanStatistics = () => {
  return useQuery({
    queryKey: jabatanKeysFinal.statistics(),
    queryFn: async () => {
      const response = await api.get('/jabatans/statistics');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

const invalidateAllJabatanCache = async (queryClient) => {
  await queryClient.cancelQueries({ queryKey: jabatanKeysFinal.all });

  queryClient.removeQueries({ queryKey: jabatanKeysFinal.all });

  await queryClient.invalidateQueries({
    queryKey: jabatanKeysFinal.all,
    exact: false,
    refetchType: 'all',
  });
};

export const useCreateJabatan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => api.post('/jabatans', data),
    onSuccess: async () => {
      await invalidateAllJabatanCache(queryClient);
    },
  });
};

export const useUpdateJabatan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jabatans/${id}`, data),
    onSuccess: async (response, variables) => {
      // Update detail cache
      queryClient.setQueryData(
        jabatanKeysFinal.detail(variables.id),
        response.data.data
      );

      await invalidateAllJabatanCache(queryClient);
    },
  });
};

export const useDeleteJabatan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.delete(`/jabatans/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: jabatanKeysFinal.lists() });

      const previousQueries = queryClient.getQueriesData({
        queryKey: jabatanKeysFinal.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: jabatanKeysFinal.lists() },
        (old) => {
          if (!old?.jabatans) return old;
          return {
            ...old,
            jabatans: old.jabatans.filter((j) => j.id !== id),
            meta: {
              ...old.meta,
              total: (old.meta.total || 0) - 1,
            },
          };
        }
      );

      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: async () => {
      await invalidateAllJabatanCache(queryClient);
    },
  });
};