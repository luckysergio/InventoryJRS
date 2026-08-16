import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';
import { masterKeys, invalidateRelatedCaches } from './useMasterData';

export const useJenisProducts = (params = {}) => {
  const { search = '', with_count = true, perPage = 12, page = 1 } = params;

  return useQuery({
    queryKey: masterKeys.jenis.list({ search, with_count, perPage, page }),
    queryFn: async () => {
      const response = await api.get('/jenis', {
        params: {
          search: search || undefined,
          with_count,
          per_page: perPage,
          page,
        },
      });
      return {
        jenisProducts: response.data.data || [],
        meta: response.data.meta || {},
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useJenisProductStatistics = () => {
  return useQuery({
    queryKey: masterKeys.jenis.statistics(),
    queryFn: async () => {
      const response = await api.get('/jenis/statistics');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateJenisProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/jenis', data),
    onSuccess: async () => {
      await invalidateRelatedCaches(queryClient, 'jenis');
    },
  });
};

export const useUpdateJenisProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/jenis/${id}`, data),
    onSuccess: async (response, variables) => {
      queryClient.setQueryData(masterKeys.jenis.detail(variables.id), response.data.data);
      await invalidateRelatedCaches(queryClient, 'jenis');
    },
  });
};

export const useDeleteJenisProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/jenis/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: masterKeys.jenis.lists(), exact: false });
      const previousQueries = queryClient.getQueriesData({ queryKey: masterKeys.jenis.lists() });
      queryClient.setQueriesData({ queryKey: masterKeys.jenis.lists() }, (old) => {
        if (!old?.jenisProducts) return old;
        return {
          ...old,
          jenisProducts: old.jenisProducts.filter((j) => j.id !== id),
          meta: { ...old.meta, total: (old.meta.total || 0) - 1 },
        };
      });
      return { previousQueries };
    },
    onError: (err, id, context) => {
      context?.previousQueries?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: async () => {
      await invalidateRelatedCaches(queryClient, 'jenis');
    },
  });
};